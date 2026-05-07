"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelOrder,
  fetchOrderById,
  updateOrderStatus,
} from "../order.api-client";
import type { OrderDetails, OrderStatus } from "../order.ui-types";

export function useOrderDetails(params: {
  orderId: string;
  userId: string;
  role: string;
}) {
  const { orderId, userId, role } = params;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!userId) {
      setOrder(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchOrderById({
        orderId,
        userId,
        role,
      });

      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedido");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, userId, role]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function changeStatus(newStatus: OrderStatus) {
    setIsMutating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateOrderStatus({
        orderId,
        newStatus,
        userId,
        role,
      });

      await loadOrder();
      setSuccess("Status atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setIsMutating(false);
    }
  }

  async function cancel() {
    setIsMutating(true);
    setError(null);
    setSuccess(null);

    try {
      await cancelOrder({
        orderId,
        userId,
        role,
      });

      await loadOrder();
      setSuccess("Pedido cancelado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar pedido");
    } finally {
      setIsMutating(false);
    }
  }

  return {
    order,
    isLoading,
    isMutating,
    error,
    success,
    reload: loadOrder,
    changeStatus,
    cancel,
  };
}
