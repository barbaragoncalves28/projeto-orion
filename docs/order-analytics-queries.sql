-- 1) Pedidos por usuário
-- Retorna volume, valor total e recorte por status para cada usuário.
-- Bom para ranking de clientes e análise de retenção.
SELECT
  u.id AS user_id,
  u.name AS user_name,
  COUNT(o.id) AS total_orders,
  COUNT(*) FILTER (WHERE o.status = 'delivered') AS delivered_orders,
  COUNT(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
  COALESCE(SUM(o.total), 0) AS gross_revenue,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'delivered'), 0) AS delivered_revenue,
  COALESCE(AVG(o.total) FILTER (WHERE o.status = 'delivered'), 0) AS average_ticket
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY delivered_revenue DESC, total_orders DESC;

-- Índice recomendado:
-- CREATE INDEX orders_user_status_created_idx ON orders(user_id, status, created_at DESC);


-- 2) Receita por dia
-- Considera receita realizada apenas em pedidos entregues.
-- Útil para dashboards financeiros e séries temporais.
SELECT
  DATE_TRUNC('day', o.created_at)::date AS revenue_day,
  COUNT(*) AS delivered_orders,
  SUM(o.total) AS revenue,
  AVG(o.total) AS average_ticket
FROM orders o
WHERE o.status = 'delivered'
GROUP BY DATE_TRUNC('day', o.created_at)::date
ORDER BY revenue_day ASC;

-- Índice recomendado:
-- CREATE INDEX orders_delivered_created_idx ON orders(created_at) WHERE status = 'delivered';


-- 3) Produtos mais vendidos
-- Soma quantidade vendida e receita gerada por produto em pedidos entregues.
-- O preço vem de order_items.unit_price, que é o snapshot do momento do pedido.
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.restaurant_id,
  COUNT(DISTINCT oi.order_id) AS orders_count,
  SUM(oi.quantity) AS units_sold,
  SUM(oi.quantity * oi.unit_price) AS product_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'delivered'
GROUP BY p.id, p.name, p.restaurant_id
ORDER BY units_sold DESC, product_revenue DESC
LIMIT 20;

-- Índices recomendados:
-- CREATE INDEX order_items_product_order_idx ON order_items(product_id, order_id);
-- CREATE INDEX orders_status_id_idx ON orders(status, id);


-- 4) Tempo médio entre status
-- Calcula o tempo médio entre uma etapa e a próxima usando o histórico.
-- Exemplo: pending -> confirmed, confirmed -> preparing, etc.
WITH status_pairs AS (
  SELECT
    h.order_id,
    h.status AS from_status,
    LEAD(h.status) OVER (
      PARTITION BY h.order_id
      ORDER BY h.changed_at
    ) AS to_status,
    h.changed_at AS from_changed_at,
    LEAD(h.changed_at) OVER (
      PARTITION BY h.order_id
      ORDER BY h.changed_at
    ) AS to_changed_at
  FROM order_status_history h
)
SELECT
  from_status,
  to_status,
  COUNT(*) AS transitions_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (to_changed_at - from_changed_at)) / 60), 2) AS avg_minutes,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (to_changed_at - from_changed_at)) / 60
  )::numeric, 2) AS median_minutes
FROM status_pairs
WHERE to_status IS NOT NULL
GROUP BY from_status, to_status
ORDER BY from_status, to_status;

-- Índice recomendado:
-- CREATE INDEX order_status_history_order_changed_idx
--   ON order_status_history(order_id, changed_at);


-- 5) Tempo médio total do pedido
-- Mede duração entre criação do pedido e entrega.
-- Ajuda a acompanhar SLA operacional.
SELECT
  DATE_TRUNC('day', o.created_at)::date AS order_day,
  COUNT(*) AS delivered_orders,
  ROUND(AVG(EXTRACT(EPOCH FROM (delivered.changed_at - o.created_at)) / 60), 2) AS avg_delivery_minutes
FROM orders o
JOIN LATERAL (
  SELECT h.changed_at
  FROM order_status_history h
  WHERE h.order_id = o.id
    AND h.status = 'delivered'
  ORDER BY h.changed_at ASC
  LIMIT 1
) delivered ON true
WHERE o.status = 'delivered'
GROUP BY DATE_TRUNC('day', o.created_at)::date
ORDER BY order_day ASC;

-- Índices recomendados:
-- CREATE INDEX order_status_history_status_order_changed_idx
--   ON order_status_history(status, order_id, changed_at);
