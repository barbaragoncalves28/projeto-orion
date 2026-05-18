'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  cancelOrder,
  fetchOrderById,
  updateOrderStatus,
} from '../order.api-client'
import type { OrderDetails, OrderStatus } from '../order.ui-types'

export function useOrderDetails(params: { orderId: string }) {
  const { orderId } = params

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrder = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchOrderById({
        orderId,
      })

      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedido')
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    let isCurrent = true

    async function loadInitialOrder() {
      try {
        const data = await fetchOrderById({
          orderId,
        })

        if (!isCurrent) return

        setOrder(data)
        setError(null)
      } catch (err) {
        if (!isCurrent) return

        setError(err instanceof Error ? err.message : 'Erro ao carregar pedido')
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialOrder()

    return () => {
      isCurrent = false
    }
  }, [orderId])

  async function changeStatus(newStatus: OrderStatus) {
    setIsMutating(true)
    setError(null)

    try {
      await updateOrderStatus({
        orderId,
        newStatus,
      })

      await loadOrder()
      toast.success('Status atualizado com sucesso.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar status'

      setError(message)
      toast.error(message)
    } finally {
      setIsMutating(false)
    }
  }

  async function cancel() {
    setIsMutating(true)
    setError(null)

    try {
      await cancelOrder({
        orderId,
      })

      await loadOrder()
      toast.success('Pedido cancelado com sucesso.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao cancelar pedido'

      setError(message)
      toast.error(message)
    } finally {
      setIsMutating(false)
    }
  }

  return {
    order,
    isLoading,
    isMutating,
    error,
    reload: loadOrder,
    changeStatus,
    cancel,
  }
}
