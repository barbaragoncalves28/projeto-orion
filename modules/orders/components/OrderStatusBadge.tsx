import type { OrderStatus } from "../order.ui-types";
import { statusClasses, statusLabels } from "../order.ui";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-md border px-3 py-1 text-xs font-medium ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
