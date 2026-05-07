"use client";

import { useEffect, useState } from "react";
import { fetchOrders } from "../order.api-client";
import type { OrderListItem } from "../order.ui-types";

export function useOrders(params: { status?: string }) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchOrders({
          status: params.status,
          page: 1,
          limit: 10,
        });

        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar pedidos"
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, [params.status]);

  return {
    orders,
    isLoading,
    error,
  };
}