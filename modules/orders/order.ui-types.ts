export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "order_ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderListItem = {
  id: string;
  status: OrderStatus;
  total: string | number;
  created_at: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: string | number;
  }[];
};

export type OrderDetails = Omit<OrderListItem, "items"> & {
  user_id: string;
  restaurant_id: string;
  delivery_address: string;
  items: { 
    productId: string;
    name: string | null;
    quantity: number;
    unitPrice: string | number;
  }[];
  history: {
    status: OrderStatus;
    changedAt: string;
  }[];
};

export type DraftOrderItem = {
  productId: string;
  quantity: number;
};

export type ApiErrorResponse = {
  error?: string;
  details?: {
    field: string;
    message: string;
  }[];
};
