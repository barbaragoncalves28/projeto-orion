# Arquitetura de backend de pedidos

## Estrutura de pastas

```txt
app/api/orders/route.ts
app/api/orders/[id]/route.ts
app/api/orders/[id]/status/route.ts
app/api/orders/[id]/cancel/route.ts
lib/db/index.ts
modules/orders/order.controller.ts
modules/orders/order.service.ts
modules/orders/order.repository.ts
modules/orders/order.types.ts
modules/orders/order.validators.ts
docs/order-system.schema.sql
```

## Responsabilidades

`app/api/**/route.ts` expõe os Route Handlers do App Router. Eles só recebem a requisição, extraem parâmetros dinâmicos e chamam o controller.

`order.controller.ts` valida entrada HTTP, traduz erros para status HTTP e chama services. Não calcula total, não consulta banco e não decide transição de status.

`order.service.ts` concentra regras de domínio:

- pedido nasce como `pending`;
- status só avança por `pending -> confirmed -> preparing -> out_for_delivery -> delivered`;
- `cancelled` só é permitido a partir de `pending` ou `confirmed`;
- não pula status, não volta status e não altera pedido finalizado;
- total é calculado no backend usando preço atual dos produtos;
- criação e mudança de status rodam dentro de transações;
- mudança de status usa lock pessimista (`SELECT ... FOR UPDATE`) e atualização condicionada pelo status anterior.

`order.repository.ts` contém SQL e mapeamento de dados. Ele não decide regra de negócio, apenas executa operações explícitas no PostgreSQL.

`lib/db/index.ts` centraliza `Pool`, `query` e `withTransaction`.

`docs/order-system.schema.sql` descreve as tabelas, constraints e trigger para reforçar imutabilidade dos itens no banco.

## Fluxo de criação de pedido

1. `POST /api/orders` recebe `userId`, `restaurantId` e `items`.
2. Controller valida o payload com `createOrderSchema`.
3. Service abre uma transação com `withTransaction`.
4. Repository busca os produtos do restaurante com `FOR SHARE`.
5. Service monta um snapshot de itens com `unitPrice` vindo do banco.
6. Service calcula `total = soma(unitPrice * quantity)`.
7. Repository insere `orders` com status `pending` e total calculado.
8. Repository insere `order_items` com quantidade e preço congelado.
9. Repository insere histórico inicial `pending`.
10. Transação faz `COMMIT`; se qualquer etapa falhar, faz `ROLLBACK`.

## Concorrência

Atualizações de status executam em transação:

1. Busca o pedido com `SELECT ... FOR UPDATE`.
2. Valida a transição a partir do status bloqueado.
3. Atualiza com `WHERE id = $2 AND status = $3`.
4. Registra histórico na mesma transação.

Com isso, duas chamadas concorrentes para o mesmo pedido são serializadas pelo PostgreSQL. A segunda chamada valida o status já atualizado e falha com `409` se tentar pular, voltar ou cancelar tarde demais.
