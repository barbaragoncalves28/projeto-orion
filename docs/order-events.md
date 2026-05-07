# Eventos de pedidos

## Modelo implementado

O sistema usa um outbox simples em PostgreSQL:

1. A mudança de status acontece dentro de uma transação.
2. Na mesma transação, o service grava `order_status_history`.
3. Ainda na mesma transação, o service grava um evento em `order_events`.
4. Um dispatcher interno faz claim dos eventos pendentes com `FOR UPDATE SKIP LOCKED`.
5. Cada evento é processado em uma transação curta própria.
6. O handler marca `processed_at`, agenda retry ou envia para dead-letter.

Isso evita o problema clássico de atualizar o pedido e falhar antes de publicar o evento.

## Eventos gravados

```txt
confirmed        -> order_confirmed
preparing        -> order_preparing
out_for_delivery -> order_out_for_delivery
delivered        -> order_delivered
cancelled        -> order_cancelled
```

O payload contém:

```json
{
  "orderId": "...",
  "userId": "...",
  "restaurantId": "...",
  "previousStatus": "out_for_delivery",
  "newStatus": "delivered",
  "total": 100,
  "changedBy": "...",
  "occurredAt": "2026-04-29T20:00:00.000Z"
}
```

## Exemplo: order_delivered

O dispatcher trata `order_delivered` atualizando `order_daily_metrics`:

```ts
await processPendingOrderEvents();
```

Esse processamento é propositalmente simples. Ele pode ser chamado por cron, job interno, endpoint administrativo protegido ou processo separado.

Falhas transitórias usam retry exponencial por `next_retry_at`. Depois de 5 tentativas, o evento recebe `dead_letter_at`.

## Como escalar no mundo real

Em produção, esse desenho vira o padrão Outbox:

- a tabela `order_events` continua sendo a fonte transacional;
- um worker separado lê eventos pendentes em lotes;
- `FOR UPDATE SKIP LOCKED` permite múltiplos workers sem processar o mesmo evento ao mesmo tempo;
- handlers precisam ser idempotentes ou executar efeitos e marcação de processamento na mesma transação;
- para integrações externas, o worker publica em Kafka, SQS, RabbitMQ ou Pub/Sub;
- `attempts`, `next_retry_at` e `dead_letter_at` permitem retry e dead-letter sem fila externa.

Assim o sistema começa simples, mas sem pintar a arquitetura em um canto.
