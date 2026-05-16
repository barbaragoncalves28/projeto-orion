import { AppError } from "@/lib/errors";
import { withTransaction } from "@/lib/db";
import type {
  OrderEventName,
  OrderRecord,
} from "./order.types";
import type {
  CancelOrderInput,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from "./order.validators";
import {
  assertCanEditOrderItems,
  assertValidStatusTransition,
  buildOrderItemsSnapshot,
  calculateOrderTotal,
  uniqueProductIds,
} from "./order.domain";
import {
  createOrder,
  createOrderItems,
  getOrderById,
  getProductsByIdsForOrder,
  insertStatusHistory,
  listOrders,
  lockOrderById,
  replaceOrderItems,
  updateOrderStatus as updateOrderStatusRepository,
  updateOrderTotal,
} from "./order.repository";
import { createOrderEvent } from "./order-event.repository";

const eventNameByStatus: Record<UpdateOrderStatusInput["newStatus"], OrderEventName> = {
  confirmed: "order_confirmed",
  preparing: "order_preparing",
  order_ready: "order_ready",
  out_for_delivery: "order_out_for_delivery",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

function buildStatusChangedEvent(input: {
  order: OrderRecord;
  updated: OrderRecord;
  changedBy: string;
}) {
  return {
    orderId: input.updated.id,
    name: eventNameByStatus[input.updated.status as UpdateOrderStatusInput["newStatus"]],
    payload: {
      orderId: input.updated.id,
      userId: input.updated.user_id,
      restaurantId: input.updated.restaurant_id,
      previousStatus: input.order.status,
      newStatus: input.updated.status,
      total: Number(input.updated.total),
      changedBy: input.changedBy,
      occurredAt: new Date().toISOString(),
    },
  };
}

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    const productIds = uniqueProductIds(input.items);

    return withTransaction(async (client) => {
      const products = await getProductsByIdsForOrder(
        {
          productIds,
          restaurantId: input.restaurantId,
        },
        client
      );

      if (products.length !== productIds.length) {
        throw new AppError("Produto inválido para este restaurante", 400);
      }

      const items = buildOrderItemsSnapshot(input.items, products);
      const subtotal = calculateOrderTotal(items);
      const deliveryFee =
      input.deliveryType === "delivery" ? 8 : 0;
      const total = subtotal + deliveryFee;

      const order = await createOrder( 
        {
            userId: input.userId,
            restaurantId: input.restaurantId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            paymentMethod: input.paymentMethod,
            notes: input.notes ?? null, 
            deliveryType: input.deliveryType,
            deliveryAddress:
              input.deliveryType === "delivery"
              ? input.deliveryAddress ?? ""
              : "",

          deliveryFee,
          subtotal,
          total,

          estimatedDeliveryAt:
          input.estimatedDeliveryAt ?? null,
        },
        client
      );

      await createOrderItems(
        {
          orderId: order.id,
          items,
        },
        client
      );

      await insertStatusHistory(
        {
          orderId: order.id,
          status: "pending",
          changedBy: input.userId,
        },
        client
      );

      return {
        ...order,
        items,
      };
    });
  }

  async updateOrderStatus(input: UpdateOrderStatusInput) {
    if (input.role === "customer") {
      throw new AppError("Sem permissão para alterar status", 403);
    }

    return this.transitionOrderStatus({
      orderId: input.orderId,
      newStatus: input.newStatus,
      changedBy: input.userId,
    });
  }

  async cancelOrder(input: CancelOrderInput) {
    return this.transitionOrderStatus({
      orderId: input.orderId,
      newStatus: "cancelled",
      changedBy: input.userId,
      assertAccess: (order) => {
        if (input.role === "customer" && order.user_id !== input.userId) {
          throw new AppError("Você não pode cancelar este pedido", 403);
        }
      },
    });
  }

  async replaceItems(input: CreateOrderInput & { orderId: string }) {
    const productIds = uniqueProductIds(input.items);

    return withTransaction(async (client) => {
      const order = await lockOrderById(input.orderId, client);

      if (!order) {
        throw new AppError("Pedido não encontrado", 404);
      }

      assertCanEditOrderItems(order.status);

      const products = await getProductsByIdsForOrder(
        {
          productIds,
          restaurantId: order.restaurant_id,
        },
        client
      );

      if (products.length !== productIds.length) {
        throw new AppError("Produto inválido para este restaurante", 400);
      }

      const items = buildOrderItemsSnapshot(input.items, products);
      const total = calculateOrderTotal(items);

      await replaceOrderItems(
        {
          orderId: order.id,
          items,
        },
        client
      );

      const updated = await updateOrderTotal(
        {
          orderId: order.id,
        },
        client
      );

      return {
        ...updated,
        items,
      };
    });
  }

  async listOrders(query: {
    userId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const offset = (query.page - 1) * query.limit;

    return listOrders({
      userId: query.userId,
      limit: query.limit,
      offset,
      status: query.status,
    });
  }

  async getOrderById(input: { orderId: string; userId: string; role: string }) {
    const order = await getOrderById(input.orderId);

    if (!order) {
      throw new AppError("Pedido não encontrado", 404);
    }

    if (input.role === "customer" && order.user_id !== input.userId) {
      throw new AppError("Acesso negado", 403);
    }

    return order;
  }

  private async transitionOrderStatus(input: {
    orderId: string;
    newStatus: UpdateOrderStatusInput["newStatus"];
    changedBy: string;
    assertAccess?: (
      order: NonNullable<Awaited<ReturnType<typeof lockOrderById>>>
    ) => void;
  }) {
    return withTransaction(async (client) => {
      const order = await lockOrderById(input.orderId, client);

      if (!order) {
        throw new AppError("Pedido não encontrado", 404);
      }

      input.assertAccess?.(order);
      assertValidStatusTransition(order.status, input.newStatus);

      const updated = await updateOrderStatusRepository(
        {
          orderId: input.orderId,
          previousStatus: order.status,
          newStatus: input.newStatus,
        },
        client
      );

      if (!updated) {
        throw new AppError("Pedido foi alterado por outra requisição", 409);
      }

      await insertStatusHistory(
        {
          orderId: input.orderId,
          status: input.newStatus,
          changedBy: input.changedBy,
        },
        client
      );

      await createOrderEvent(
        buildStatusChangedEvent({
          order,
          updated,
          changedBy: input.changedBy,
        }),
        client
      );

      return updated;
    });
  }
}

export const orderService = new OrderService();

export const createOrderService = (input: CreateOrderInput) =>
  orderService.createOrder(input);

export const updateOrderStatusService = (input: UpdateOrderStatusInput) =>
  orderService.updateOrderStatus(input);

export const cancelOrderService = (input: CancelOrderInput) =>
  orderService.cancelOrder(input);

export const listOrdersService = (query: {
  userId: string;
  page: number;
  limit: number;
  status?: string;
}) => orderService.listOrders(query);

export const getOrderByIdService = (input: {
  orderId: string;
  userId: string;
  role: string;
}) => orderService.getOrderById(input);
