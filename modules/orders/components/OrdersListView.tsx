"use client";

import Link from "next/link";
import { useOrders } from "../hooks/useOrders";
import type { OrderStatus } from "../order.ui-types";
import { formatDate, formatMoney, statusLabels } from "../order.ui";
import { OrderFeedback } from "./OrderFeedback";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useState } from "react";

const statusOptions: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: statusLabels.pending },
  { value: "confirmed", label: statusLabels.confirmed },
  { value: "preparing", label: statusLabels.preparing },
  { value: "out_for_delivery", label: statusLabels.out_for_delivery },
  { value: "delivered", label: statusLabels.delivered },
  { value: "cancelled", label: statusLabels.cancelled },
];

export function OrdersListView() {
  const [status, setStatus] = useState<"" | OrderStatus>("");

  const { orders, isLoading, error } = useOrders({
  status: status || undefined,
  });

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Pedidos</p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Lista de pedidos
          </h1>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex h-10 items-center justify-center rounded bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo pedido
        </Link>
      </header>

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-4">
        <label className="grid gap-1 text-sm sm:max-w-60">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | OrderStatus)}
            className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <OrderFeedback error={error} />

      {isLoading ? (
        <LoadingRows />
      ) : orders.length === 0 ? (
        <EmptyState text="Nenhum pedido encontrado para os filtros atuais." />
      ) : (
        <section className="grid gap-3">
          {orders.map((order) => (
            <Link
              href={`/orders/${order.id}`}
              key={order.id}
              className="grid gap-3 rounded border border-slate-200 bg-white p-4 hover:border-slate-400 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-slate-600">
                    {order.id}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-slate-500">
                  {order.items.length} item(ns) • {formatDate(order.created_at)}
                </p>
              </div>

              <strong className="text-lg text-slate-950">
                {formatMoney(order.total)}
              </strong>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
