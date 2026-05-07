import { randomUUID } from "crypto";
import { withTransaction } from "@/lib/db";
import type { DbClient } from "@/lib/db";
import type { OrderEventRecord } from "./order.types";
import {
  claimPendingOrderEvents,
  getClaimedOrderEvent,
  incrementDeliveredOrderMetrics,
  markOrderEventFailed,
  markOrderEventProcessed,
} from "./order-event.repository";

const maxAttempts = 5;

type OrderEventHandler = (event: OrderEventRecord, trx: DbClient) => Promise<void>;

const handlers: Partial<Record<OrderEventRecord["name"], OrderEventHandler>> = {
  async order_delivered(event, trx) {
    await incrementDeliveredOrderMetrics(event.payload, trx);
  },
};

export async function processPendingOrderEvents(limit = 50) {
  const workerId = randomUUID();

  const claimed = await withTransaction((trx) =>
    claimPendingOrderEvents({ limit, workerId }, trx)
  );

  let processed = 0;
  let failed = 0;

  for (const event of claimed) {
    try {
      await withTransaction(async (trx) => {
        const lockedEvent = await getClaimedOrderEvent(
          {
            eventId: event.id,
            workerId,
          },
          trx
        );

        if (!lockedEvent) {
          return;
        }

        const handler = handlers[lockedEvent.name];

        if (handler) {
          await handler(lockedEvent, trx);
        }

        await markOrderEventProcessed(
          {
            eventId: lockedEvent.id,
            workerId,
          },
          trx
        );
      });

      processed += 1;
    } catch (error) {
      await withTransaction((trx) =>
        markOrderEventFailed(
          {
            eventId: event.id,
            workerId,
            maxAttempts,
            errorMessage:
              error instanceof Error ? error.message : "Erro desconhecido",
          },
          trx
        )
      );
      failed += 1;
    }
  }

  return {
    workerId,
    picked: claimed.length,
    processed,
    failed,
  };
}
