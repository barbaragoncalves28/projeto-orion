import type {
  ApiErrorResponse,
  DraftOrderItem,
  OrderDetails,
  OrderListItem,
  OrderStatus,
} from "./order.ui-types";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;
    const details = errorPayload?.details
      ?.map((detail) => `${detail.field}: ${detail.message}`)
      .join("; ");

    throw new Error(details || errorPayload?.error || "Erro na requisição");
  }

  return payload as T;
}

export async function fetchOrders(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 10));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const response = await fetch(`/api/orders?${searchParams.toString()}`);

  return parseResponse<OrderListItem[]>(response);
}

export async function fetchOrderById(params: {
  orderId: string;
}) {
  const response = await fetch(`/api/orders/${params.orderId}`);

  return parseResponse<OrderDetails>(response);
}

export async function createOrder(params: { 
  restaurantId: string;
  deliveryAddress: string;
  items: DraftOrderItem[];
}) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      restaurantId: params.restaurantId,
      deliveryAddress: params.deliveryAddress,
      items: params.items,
    }),
  });

  return parseResponse<OrderDetails>(response);
}

export async function updateOrderStatus(params: {
  orderId: string;
  newStatus: OrderStatus;
  userId?: string;
  role?: string;
}) {

  const response = await fetch(`/api/orders/${params.orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: params.orderId,
      newStatus: params.newStatus,
      userId: params.userId,
      role: params.role,
    }),
  });

  return parseResponse<OrderDetails>(response);
}

export async function cancelOrder(params: {
  orderId: string;
  userId: string;
  role: string;
}) {
  const res = await fetch(`/api/orders/${params.orderId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: params.orderId,
      userId: params.userId,
      role: params.role,
    }),
  });

  return parseResponse(res);
}
