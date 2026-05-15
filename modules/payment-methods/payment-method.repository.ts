import { query } from "@/lib/db";

export async function findAllPaymentMethods() {
  const result = await query(`
    SELECT DISTINCT payment_method AS id,
           payment_method AS name
    FROM orders
    WHERE payment_method IS NOT NULL
    ORDER BY payment_method
  `);

  return result.rows;
}