import { AppError } from "@/lib/errors";
import type { CreateOrderInput, OrderProductSnapshot, OrderStatus } from "./order.types";

export type OrderItemSnapshot = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
};

export function assertValidStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
) {
  const allowed = allowedTransitions[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Transição inválida: ${currentStatus} -> ${nextStatus}`,
      409
    );
  }
}

export function assertCanEditOrderItems(status: OrderStatus) {
  if (status !== "pending") {
    throw new AppError(
      "Itens do pedido não podem ser alterados após confirmação",
      409
    );
  }
}

export function buildOrderItemsSnapshot(
  inputItems: CreateOrderInput["items"],
  products: OrderProductSnapshot[]
): OrderItemSnapshot[] {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return inputItems.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new AppError("Produto inválido para este restaurante", 400);
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(product.price),
    };
  });
}

export function calculateOrderTotal(items: OrderItemSnapshot[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function uniqueProductIds(items: CreateOrderInput["items"]) {
  return [...new Set(items.map((item) => item.productId))];
}
