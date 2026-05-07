import { pool, type DbClient } from "@/lib/db";
import type { OrderItemSnapshot } from "./order.domain";
import type { OrderProductSnapshot, OrderRecord, OrderStatus } from "./order.types";

type QueryClient = DbClient;

const clientOrPool = (trx?: QueryClient): QueryClient => trx ?? pool;

export type CreateOrderParams = {
  userId: string;
  restaurantId: string;
  deliveryAddress: string;
  total: number;
};

export type CreateOrderItemsParams = {
  orderId: string;
  items: OrderItemSnapshot[];
};

export type UpdateOrderStatusParams = {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
};

export type OrderDetailsRow = OrderRecord & {
  items: {
    productId: string;
    name: string | null;
    quantity: number;
    unitPrice: number;
  }[];
  history: {
    status: OrderStatus;
    changedAt: string;
  }[];
};

export async function createOrder(
  params: CreateOrderParams,
  trx: QueryClient
): Promise<OrderRecord> {
  const result = await clientOrPool(trx).query<OrderRecord>(
    `
    INSERT INTO orders (
      user_id,
      restaurant_id,
      delivery_address,
      status,
      total
)
VALUES ($1, $2, $3, 'pending', $4)
    RETURNING
      id,
      user_id,
      restaurant_id,
      delivery_address,
      status,
      total,
      created_at
    `,
    [ params.userId, params.restaurantId, params.deliveryAddress, params.total, ]
  );

  return result.rows[0];
}

export async function createOrderItems(
  params: CreateOrderItemsParams,
  trx: QueryClient
): Promise<void> {
  if (params.items.length === 0) return;

  const values: unknown[] = [];

  const placeholders = params.items.map((item, index) => {
    const offset = index * 4;

    values.push(
      params.orderId,
      item.productId,
      item.quantity,
      item.unitPrice
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
  });

  await clientOrPool(trx).query(
    `
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price
    )
    VALUES ${placeholders.join(", ")}
    `,
    values
  );
}

export async function getOrderById(
  orderId: string,
  trx?: QueryClient
): Promise<OrderDetailsRow | undefined> {
  const result = await clientOrPool(trx).query<OrderDetailsRow>(
    `
    SELECT
  o.id,
  o.user_id,
  u.name AS customer_name,
  o.restaurant_id,
  r.name AS restaurant_name,
  o.delivery_address,
  o.status,
  o.total,
  o.created_at,
 
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'productId', oi.product_id,
        'name', p.name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'
  ) AS items

FROM orders o

LEFT JOIN users u
  ON u.id = o.user_id

LEFT JOIN restaurants r
  ON r.id = o.restaurant_id

LEFT JOIN order_items oi
  ON oi.order_id = o.id

LEFT JOIN products p
  ON p.id = oi.product_id

WHERE o.id = $1

GROUP BY
  o.id,
  o.user_id,
  o.restaurant_id,
  o.delivery_address,
  o.status,
  o.total,
  o.created_at,
  u.name,
  r.name
    `,
    [orderId]
  );

  return result.rows[0];
}

export async function lockOrderById(
  orderId: string,
  trx: QueryClient
): Promise<OrderRecord | undefined> {
  const result = await trx.query<OrderRecord>(
    `
    SELECT
      id,
      user_id,
      restaurant_id,
      delivery_address,
      status,
      total,
      created_at
    FROM orders
    WHERE id = $1
    FOR UPDATE
    `,
    [orderId]
  );

  return result.rows[0];
}

export async function getProductsByIdsForOrder(
  params: {
    productIds: string[];
    restaurantId: string;
  },
  trx?: QueryClient
): Promise<OrderProductSnapshot[]> {
  const result = await clientOrPool(trx).query<OrderProductSnapshot>(
    `
    SELECT
      id,
      restaurant_id,
      price
    FROM products
    WHERE id = ANY($1::uuid[])
      AND restaurant_id = $2
    FOR SHARE
    `,
    [params.productIds, params.restaurantId]
  );

  return result.rows;
}

export async function insertStatusHistory(
  params: {
    orderId: string;
    status: OrderStatus;
    changedBy: string;
  },
  trx?: QueryClient
): Promise<void> {
  await clientOrPool(trx).query(
    `
    INSERT INTO order_status_history (
      order_id,
      status,
      changed_by
    )
    VALUES ($1, $2, $3)
    `,
    [params.orderId, params.status, params.changedBy]
  );
}

export async function replaceOrderItems(
  params: CreateOrderItemsParams,
  trx: QueryClient
): Promise<void> {
  await clientOrPool(trx).query(
    `
    DELETE FROM order_items
    WHERE order_id = $1
    `,
    [params.orderId]
  );

  await createOrderItems(params, trx);
}

export async function updateOrderTotal(
  params: {
    orderId: string;
  },
  trx: QueryClient
): Promise<OrderRecord> {
  await trx.query(
    `
    SELECT recalculate_order_total($1)
    `,
    [params.orderId]
  );

  const result = await trx.query<OrderRecord>(
    `
    SELECT
      id,
      user_id,
      restaurant_id,
      delivery_address,
      status,
      total,
      created_at
    FROM orders
    WHERE id = $1
    `,
    [params.orderId]
  );

  return result.rows[0];
}

export async function updateOrderStatus(
  params: UpdateOrderStatusParams,
  trx: QueryClient
): Promise<OrderRecord | undefined> {
  const result = await clientOrPool(trx).query<OrderRecord>(
    `
    UPDATE orders
    SET
      status = $1::order_status,
      confirmed_at = CASE WHEN $1::order_status = 'confirmed' THEN NOW() ELSE confirmed_at END,
      cancelled_at = CASE WHEN $1::order_status = 'cancelled' THEN NOW() ELSE cancelled_at END
    WHERE id = $2
      AND status = $3::order_status
    RETURNING
      id,
      user_id,
      restaurant_id,
      delivery_address,
      status,
      total,
      created_at
    `,
    [params.newStatus, params.orderId, params.previousStatus]
  );

  return result.rows[0];
}

export async function listOrders(
  params: {
    userId: string;
    limit: number;
    offset: number;
    status?: string;
  },
  trx?: QueryClient
) {
  const values: unknown[] = [params.userId];
  let where = "WHERE o.user_id = $1";

  if (params.status) {
    values.push(params.status);
    where += ` AND o.status = $${values.length}`;
  }

  values.push(params.limit, params.offset);

  const result = await clientOrPool(trx).query(
    `
    SELECT
  o.id,
  o.status,
  o.total,
  o.delivery_address,
  o.created_at,

  u.name AS customer_name,
  r.name AS restaurant_name,

  COALESCE(
    json_agg(
      json_build_object(
        'productId', oi.product_id,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'
  ) AS items

FROM orders o

LEFT JOIN users u
  ON u.id = o.user_id

LEFT JOIN restaurants r
  ON r.id = o.restaurant_id

LEFT JOIN order_items oi
  ON oi.order_id = o.id

${where}

GROUP BY
  o.id,
  o.user_id,
  o.restaurant_id,
  o.delivery_address,
  o.status,
  o.total,
  o.created_at,
  u.name,
  r.name

ORDER BY o.created_at DESC

LIMIT $${values.length - 1}
OFFSET $${values.length}
    `,
    values
  );

  return result.rows;
}
