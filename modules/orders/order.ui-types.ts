export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'order_ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type OrderDeliveryType = 'delivery' | 'pickup'

export type OrderListItem = {
  id: string
  status: OrderStatus
  subtotal: string | number
  delivery_fee: string | number
  total: string | number
  delivery_type: OrderDeliveryType
  delivery_address: string | null
  payment_method: string
  customer_name: string
  customer_phone: string
  restaurant_name: string | null
  created_at: string
  items: {
    productId: string
    quantity: number
    unitPrice: string | number
  }[]
}

export type OrderDetails = Omit<OrderListItem, 'items'> & {
  user_id: string
  restaurant_id: string
  notes: string | null
  items: {
    productId: string
    name: string | null
    quantity: number
    unitPrice: string | number
  }[]
  history: {
    status: OrderStatus
    changedAt: string
  }[]
}

export type DraftOrderItem = {
  productId: string
  quantity: number
}

export type ApiErrorResponse = {
  error?: string
  details?: {
    field: string
    message: string
  }[]
}
