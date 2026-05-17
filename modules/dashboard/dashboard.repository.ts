import { pool } from "@/lib/db";
export async function getTotalRevenue() {
  const res = await pool.query(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE status = 'delivered'
  `);

  return Number(res.rows[0].total);
}

export async function getAverageTicket() {
  const res = await pool.query(`
    SELECT COALESCE(AVG(total), 0) as avg
    FROM orders
    WHERE status = 'delivered'
  `);

  return Number(res.rows[0].avg);
}

export async function getOrdersPerDay() {
  const res = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total
    FROM orders
    GROUP BY date
    ORDER BY date ASC
  `);

  return res.rows;
}

export async function getOrdersByStatus() {
  const res = await pool.query(`
    SELECT
      status,
      COUNT(*)::int as total
    FROM orders
    GROUP BY status
    ORDER BY total DESC
  `);

  return res.rows;
}

export async function getTopProducts() {
  const res = await pool.query(`
    SELECT 
      p.id as "productId",
      p.name,
      SUM(oi.quantity) as "totalSold"
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'delivered'
    GROUP BY p.id
    ORDER BY "totalSold" DESC
    LIMIT 5
  `);

  return res.rows;
}

export async function getAverageDeliveryTime() {
  const res = await pool.query(`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes
    FROM orders
    WHERE status = 'delivered'
  `);

  return Number(res.rows[0].avg_minutes);
}

export async function getOrdersByPaymentMethod() {
  const res = await pool.query(`
    SELECT
      payment_method,
      COUNT(*)::int as total
    FROM orders
    GROUP BY payment_method
    ORDER BY total DESC
  `);

  return res.rows;
}