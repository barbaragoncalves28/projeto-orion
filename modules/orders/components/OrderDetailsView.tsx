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
import { OrderSessionFields } from "./OrderSessionFields";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderDetailsView({ orderId }: { orderId: string }) {
  const { session, updateSession } = useOrderSession();

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

  const nextStatus = order ? nextStatusByCurrent[order.status] : undefined;
  const canChangeStatus = Boolean(nextStatus) && session.role !== "customer";
  const canCancelOrder = order ? canCancel(order.status) : false;

  const items = order?.items ?? [];
  const history = order?.history ?? [];

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/orders" className="text-sm font-medium text-slate-500">
            Voltar para pedidos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Detalhes do pedido
          </h1>
        </div>
      </header>

      <section className="rounded border border-slate-200 bg-white p-4">
        <OrderSessionFields
          userId={session.userId}
          role={session.role}
          onChange={updateSession}
        />
      </section>

      <OrderFeedback error={error} success={success} />

      {!session.userId ? (
        <EmptyState text="Informe o UUID do usuário para consultar o pedido." />
      ) : isLoading ? (
        <div className="h-80 animate-pulse rounded border border-slate-200 bg-slate-100" />
      ) : order ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4 rounded border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-2">
                <span className="font-mono text-sm text-slate-500">
                  {order.id}
                </span>
                <OrderStatusBadge status={order.status} />

                <div className="mt-4 grid gap-2 text-sm">
                  <p>
                    <strong>Cliente:</strong> {order.customer_name}
                  </p>

                  <p>
                    <strong>Restaurante:</strong> {order.restaurant_name}
                  </p>

                  <p>
                    <strong>Endereço:</strong> {order.address}
                  </p>
              </div>
              </div>
              <strong className="text-2xl text-slate-950">
                {formatMoney(order.total)}
              </strong>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">Itens</h2>

              <div className="mt-3 divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.name || item.productId}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} x {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">
                      {formatMoney(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <section className="grid gap-3 rounded border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-950">Ações</h2>

              <button
                type="button"
                disabled={!canChangeStatus || isMutating}
                onClick={() => nextStatus && void changeStatus(nextStatus)}
                className="h-10 rounded bg-slate-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {nextStatus
                  ? `Avançar para ${statusLabels[nextStatus]}`
                  : "Sem próxima etapa"}
              </button>

              <button
                type="button"
                disabled={!canCancelOrder || isMutating}
                onClick={() => void cancel()}
                className="h-10 rounded border border-rose-300 px-4 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Cancelar pedido
              </button>

              <p className="text-xs leading-5 text-slate-500">
                A interface bloqueia ações conhecidas como inválidas, mas a
                decisão final sempre vem da API.
              </p>
            </section>

            <section className="grid gap-3 rounded border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-950">Histórico</h2>

              <div className="grid gap-3">
                {history.map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="grid gap-1">
                    <OrderStatusBadge status={entry.status} />
                    <span className="text-xs text-slate-500">
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
    <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
