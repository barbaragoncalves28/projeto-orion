"use client";

import Link from "next/link";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { useOrderSession } from "../hooks/useOrderSession";
import {
  canCancel,
  formatDate,
  formatMoney,
  nextStatusByCurrent,
  statusLabels,
} from "../order.ui";
import { OrderFeedback } from "./OrderFeedback";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderDetailsView({ orderId }: { orderId: string }) {
  const { session } = useOrderSession();

  const {
    order,
    isLoading,
    isMutating,
    error,
    success,
    changeStatus,
    cancel,
  } = useOrderDetails({
    orderId,
    userId: session.userId,
    role: session.role,
  });

  console.log("ORDER:", order);

  const nextStatus = order ? nextStatusByCurrent[order.status] : undefined;
  const canChangeStatus = Boolean(nextStatus) && session.role !== "customer";
  const canCancelOrder = order ? canCancel(order.status) : false;

  const items = order?.items ?? [];
  const history = order?.history ?? [];

  return (
    <main className="min-h-screen bg-slate-50 mx-auto w-full gap-6 px-4 py-8 sm:px-6 lg:px-20">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Voltar para pedidos
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-7 mt-5">
            Detalhes do pedido
          </h1>
        </div>
      </header>

      <OrderFeedback error={error} success={success} />

      {!session.userId ? (
        <EmptyState text="Informe o UUID do usuário para consultar o pedido." />
      ) : isLoading ? (
        <div className="h-80 animate-pulse rounded border border-slate-200 bg-slate-100" />
      ) : order ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4  bg-white p-4 rounded-2xl border border-slate-200  shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Pedido: #{order.id.slice(0, 4).toUpperCase()}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />

                <div className="mt-4 grid gap-2 text-sm">
                  <p>
                    <strong className="text-slate-700">Cliente:</strong> {order.customer_name}
                  </p>

                  <p>
                    <strong className="text-slate-700">Restaurante:</strong> {order.restaurant_name}
                  </p>

                  <p>
                    <strong className="text-slate-700">Endereço:</strong> {order.delivery_address}
                  </p>
              </div>
              </div>
              <strong className="text-2xl text-slate-800">
                {formatMoney(order.total)}
              </strong>
            </div>

            <div>
              <h2 className="text-slate-700 font-bold">Itens do pedido</h2>

              <div className="mt-3 divide-y divide-slate-100">
                {items.map((item) => ( 
                  <div
                    key={item.productId} 
                    className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {item.name || item.productId}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} x {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatMoney(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <section className="grid gap-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

              <button
                type="button"
                disabled={!canChangeStatus || isMutating}
                onClick={() => nextStatus && void changeStatus(nextStatus)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 bg-blue-600 shadow-lg transition-all duration-300 hover:bg-blue-500
                "
              >
                {nextStatus
                  ? `Avançar para ${statusLabels[nextStatus]}`
                  : "Sem próxima etapa"}
              </button>

              <button
                type="button"
                disabled={!canCancelOrder || isMutating}
                onClick={() => void cancel()}
                className="h-10 rounded-xl border px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 bg-red-600 shadow-lg transition-all duration-300 hover:bg-red-500
                "
              >
                Cancelar pedido
              </button>

              <p className="text-xs leading-5 text-slate-400">
                Atualize o status do pedido conforme o andamento da entrega.
              </p>
            </section>

            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
            ">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Histórico</h2>

              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="grid space-y-1">
                    <OrderStatusBadge status={entry.status} />
                    <span className="block text-xs text-slate-500">
                      {formatDate(entry.changedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <EmptyState text="Pedido não encontrado." />
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
