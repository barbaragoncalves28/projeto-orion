export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface CreateOrderInput {
  userId: string;
  restaurantId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface ListOrdersQuery {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetOrderByIdInput {
  orderId: string;
  userId: string;
  role: "customer" | "admin" | "vendor";
}

export interface UpdateOrderStatusInput {
  orderId: string;
  newStatus:
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  userId: string;
  role: "admin" | "vendor" | "customer";
}

export interface CancelOrderInput {
  orderId: string;
  userId: string;
  role: "customer" | "admin" | "vendor";
}

export interface OrderProductSnapshot {
  id: string;
  restaurant_id: string;
  price: number;
}

export interface OrderRecord {
  id: string;
  user_id: string;
  restaurant_id: string;
  status: OrderStatus;
  total: number;
  created_at: Date | string;
}

export type OrderEventName =
  | "order_confirmed"
  | "order_preparing"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled";

export type OrderEventPayload = {
  orderId: string;
  userId: string;
  restaurantId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  total: number;
  changedBy: string;
  occurredAt: string;
};

export type OrderEventRecord = {
  id: string;
  order_id: string;
  name: OrderEventName;
  payload: OrderEventPayload;
  attempts: number;
  next_retry_at: Date | string;
  locked_at: Date | string | null;
  locked_by: string | null;
  processed_at: Date | string | null;
  failed_at: Date | string | null;
  dead_letter_at: Date | string | null;
  error_message: string | null;
  created_at: Date | string;
};
