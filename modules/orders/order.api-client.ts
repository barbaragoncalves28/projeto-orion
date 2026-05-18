import type {
  ApiErrorResponse,
  DraftOrderItem,
  OrderDetails,
  OrderListItem,
  OrderStatus,
} from './order.ui-types'

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null
    const details = errorPayload?.details
      ?.map((detail) => `${detail.field}: ${detail.message}`)
      .join('; ')

    throw new Error(details || errorPayload?.error || 'Erro na requisição')
  }

  return payload as T
}

export async function fetchOrders(params: {
  status?: string
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()

  searchParams.set('page', String(params.page ?? 1))
  searchParams.set('limit', String(params.limit ?? 10))

  if (params.status) {
    searchParams.set('status', params.status)
  }

  const response = await fetch(`/api/orders?${searchParams.toString()}`)

  return parseResponse<OrderListItem[]>(response)
}

export async function fetchOrderById(params: { orderId: string }) {
  const response = await fetch(`/api/orders/${params.orderId}`)

  return parseResponse<OrderDetails>(response)
}

export async function createOrder(params: {
  restaurantId: string
  customerName: string
  customerPhone: string
  paymentMethod: 'pix' | 'dinheiro' | 'debito' | 'credito'
  notes?: string
  deliveryType: 'delivery' | 'pickup'
  deliveryAddress: string
  estimatedDeliveryAt?: string
  items: DraftOrderItem[]
}) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      restaurantId: params.restaurantId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      deliveryType: params.deliveryType,
      deliveryAddress: params.deliveryAddress,
      estimatedDeliveryAt: params.estimatedDeliveryAt,
      items: params.items,
    }),
  })

  return parseResponse<OrderDetails>(response)
}

export async function updateOrderStatus(params: {
  orderId: string
  newStatus: OrderStatus
}) {
  const response = await fetch(`/api/orders/${params.orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newStatus: params.newStatus,
    }),
  })

  return parseResponse<OrderDetails>(response)
}

export async function cancelOrder(params: { orderId: string }) {
  const res = await fetch(`/api/orders/${params.orderId}/cancel`, {
    method: 'PATCH',
  })

  return parseResponse(res)
}
