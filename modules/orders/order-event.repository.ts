import { pool, type DbClient } from "@/lib/db";
import type {
  OrderEventName,
  OrderEventPayload,
  OrderEventRecord,
} from "./order.types";

type QueryClient = DbClient;

const eventColumns = `
  id,
  order_id,
  name,
  payload,
  attempts,
  next_retry_at,
  locked_at,
  locked_by,
  processed_at,
  failed_at,
  dead_letter_at,
  error_message,
  created_at
`;

export async function createOrderEvent(
  params: {
    orderId: string;
    name: OrderEventName;
    payload: OrderEventPayload;
  },
  trx: QueryClient
): Promise<OrderEventRecord> {
  const result = await trx.query<OrderEventRecord>(
    `
    INSERT INTO order_events (
      order_id,
      name,
      payload
    )
    VALUES ($1, $2, $3)
    RETURNING ${eventColumns}
    `,
    [params.orderId, params.name, params.payload]
  );

  return result.rows[0];
}

export async function claimPendingOrderEvents(
  params: {
    limit: number;
    workerId: string;
  },
  trx: QueryClient
): Promise<OrderEventRecord[]> {
  const result = await trx.query<OrderEventRecord>(
    `
    WITH candidates AS (
      SELECT id
      FROM order_events
      WHERE processed_at IS NULL
        AND dead_letter_at IS NULL
        AND next_retry_at <= NOW()
        AND (
          locked_at IS NULL
          OR locked_at < NOW() - INTERVAL '5 minutes'
        )
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE order_events e
    SET
      locked_at = NOW(),
      locked_by = $2
    FROM candidates
    WHERE e.id = candidates.id
    RETURNING ${eventColumns}
    `,
    [params.limit, params.workerId]
  );

  return result.rows;
}

export async function markOrderEventProcessed(
  params: {
    eventId: string;
    workerId: string;
  },
  trx: QueryClient
): Promise<void> {
  await trx.query(
    `
    UPDATE order_events
    SET
      processed_at = NOW(),
      locked_at = NULL,
      locked_by = NULL,
      error_message = NULL
    WHERE id = $1
      AND locked_by = $2
    `,
    [params.eventId, params.workerId]
  );
}

export async function markOrderEventFailed(
  params: {
    eventId: string;
    workerId: string;
    errorMessage: string;
    maxAttempts: number;
  },
  trx: QueryClient
): Promise<void> {
  await trx.query(
    `
    UPDATE order_events
    SET
      attempts = attempts + 1,
      failed_at = NOW(),
      dead_letter_at = CASE
        WHEN attempts + 1 >= $3 THEN NOW()
        ELSE dead_letter_at
      END,
      next_retry_at = CASE
        WHEN attempts + 1 >= $3 THEN next_retry_at
        ELSE NOW() + (INTERVAL '1 minute' * POWER(2, attempts))
      END,
      locked_at = NULL,
      locked_by = NULL,
      error_message = $4
    WHERE id = $1
      AND locked_by = $2
    `,
    [params.eventId, params.workerId, params.maxAttempts, params.errorMessage]
  );
}

export async function incrementDeliveredOrderMetrics(
  payload: OrderEventPayload,
  trx: QueryClient
): Promise<void> {
  await trx.query(
    `
    INSERT INTO order_daily_metrics (
      metric_day,
      restaurant_id,
      delivered_orders,
      delivered_revenue
    )
    VALUES ($1, $2, 1, $3)
    ON CONFLICT (metric_day, restaurant_id)
    DO UPDATE SET
      delivered_orders = order_daily_metrics.delivered_orders + 1,
      delivered_revenue = order_daily_metrics.delivered_revenue + EXCLUDED.delivered_revenue,
      updated_at = NOW()
    `,
    [
      new Date(payload.occurredAt).toISOString().slice(0, 10),
      payload.restaurantId,
      payload.total,
    ]
  );
}

export async function getClaimedOrderEvent(
  params: {
    eventId: string;
    workerId: string;
  },
  trx: QueryClient
): Promise<OrderEventRecord | undefined> {
  const result = await trx.query<OrderEventRecord>(
    `
    SELECT ${eventColumns}
    FROM order_events
    WHERE id = $1
      AND locked_by = $2
      AND processed_at IS NULL
      AND dead_letter_at IS NULL
    FOR UPDATE
    `,
    [params.eventId, params.workerId]
  );

  return result.rows[0];
}

export async function countPendingOrderEvents(): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `
    SELECT COUNT(*) AS total
    FROM order_events
    WHERE processed_at IS NULL
      AND dead_letter_at IS NULL
    `
  );

  return Number(result.rows[0].total);
}
