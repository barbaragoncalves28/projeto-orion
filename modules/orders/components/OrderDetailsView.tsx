'use client'

import { useOrderDetails } from '../hooks/useOrderDetails'
import {
  canCancel,
  capitalize,
  formatDate,
  formatMoney,
  formatPhone,
  getNextStatus,
  statusLabels,
} from '../order.ui'
import { OrderDeliveryTypeBadge } from './OrderDeliveryTypeBadge'
import { OrderFeedback } from './OrderFeedback'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PageHeader } from './PageHeader'

type UserRole = 'customer' | 'vendor' | 'admin'

export function OrderDetailsView({
  orderId,
  currentUserRole,
}: {
  orderId: string
  currentUserRole: UserRole
}) {
  const { order, isLoading, isMutating, error, changeStatus, cancel } =
    useOrderDetails({
      orderId,
    })

  const nextStatus = order
    ? getNextStatus(order.status, order.delivery_type)
    : undefined
  const canChangeStatus = Boolean(nextStatus) && currentUserRole !== 'customer'
  const canCancelOrder = order ? canCancel(order.status) : false

  const items = order?.items ?? []
  const history = order?.history ?? []

  return (
    <main className="min-h-screen bg-slate-50 mx-auto w-full gap-6 px-4 py-8 sm:px-6 lg:px-20">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageHeader title="Detalhes do pedido" />
        </div>
      </header>

      <OrderFeedback error={error} />

      {isLoading ? (
        <div className="h-80 animate-pulse rounded border border-slate-200 bg-slate-100" />
      ) : order ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="grid gap-4  bg-white p-4 rounded-2xl border border-slate-200  shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Pedido: #{order.id.slice(0, 4).toUpperCase()}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />

                <div className="grid gap-2 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    <OrderDeliveryTypeBadge type={order.delivery_type} />
                  </div>
                  <p className="mt-4 wrap-break-word">
                    <strong className="text-slate-700 text-base">
                      Cliente:
                    </strong>{' '}
                    {capitalize(order.customer_name)}
                  </p>

                  <p>
                    <strong className="text-slate-700 text-base">
                      Telefone:
                    </strong>{' '}
                    {formatPhone(order.customer_phone)}
                  </p>

                  <p>
                    <strong className="text-slate-700 text-base">
                      Forma de pagamento:
                    </strong>{' '}
                    {capitalize(order.payment_method)}
                  </p>

                  {order.delivery_type === 'delivery' && (
                    <p className="wrap-break-word">
                      <strong className="text-slate-700 text-base">
                        Endereço:
                      </strong>{' '}
                      {capitalize(order.delivery_address ?? '')}
                    </p>
                  )}

                  <p>
                    <strong className="text-slate-700 text-base">
                      Restaurante:
                    </strong>{' '}
                    {order.restaurant_name}
                  </p>

                  {order.notes && (
                    <div className="grid gap-2">
                      <label className="text-slate-700 text-base font-bold wrap-break-word">
                        Observações:
                      </label>

                      <textarea
                        value={capitalize(order.notes)}
                        readOnly
                        rows={4}
                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-slate-700 font-bold text-base">
                Itens do pedido:
              </h2>

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

            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                Resumo do pedido
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(order.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Taxa de entrega</span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(order.delivery_fee)}
                  </span>
                </div>

                <div className="border-t border-slate-300 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">
                      Total Geral
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </section>

          <aside className="grid content-start gap-4 w-full">
            <section className="grid gap-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                disabled={!canChangeStatus || isMutating}
                onClick={() => nextStatus && void changeStatus(nextStatus)}
                className="cursor-pointer h-10 rounded-xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 bg-blue-600 shadow-lg transition-all duration-300 hover:bg-blue-500
                "
              >
                {nextStatus
                  ? `${statusLabels[nextStatus]}`
                  : 'Sem próxima etapa'}
              </button>

              <button
                type="button"
                disabled={!canCancelOrder || isMutating}
                onClick={() => void cancel()}
                className="cursor-pointer h-10 rounded-xl border px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 bg-red-600 shadow-lg transition-all duration-300 hover:bg-red-500
                "
              >
                Cancelar pedido
              </button>

              <p className="text-xs leading-5 text-slate-400">
                Atualize o status do pedido conforme o andamento da entrega.
              </p>
            </section>

            <section
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
            "
            >
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                Histórico
              </h2>

              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div
                    key={`${entry.status}-${index}`}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
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
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  )
}
