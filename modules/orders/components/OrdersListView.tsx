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
    <main className="min-h-screen bg-slate-50 mx-auto grid w-full gap-6 px-4 py-8 sm:px-6 lg:px-20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Lista de pedidos
          </h1>
        </div>

        <Link
          href="/orders/new"
          className="cursor-pointer inline-flex h-10 items-center text-sm rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
        >
          Novo pedido
        </Link>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="grid gap-2 text-sm sm:max-w-60">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | OrderStatus)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
        <EmptyState text="Nenhum pedido encontrado." />
      ) : (
        <section className="grid gap-4">
          {orders.map((order) => (
            <Link
              href={`/orders/${order.id}`}
              key={order.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600">
                    Pedido #{order.id.slice(0, 4).toUpperCase()}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-slate-500">
                  {order.items.length} item(ns) • {formatDate(order.created_at)}
                </p>
              </div>

              <strong className="text-xl font-bold text-slate-800">
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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
        />
      ))} 
    </div>
  );
}
