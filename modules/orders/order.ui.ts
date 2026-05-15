import type { OrderStatus } from "./order.ui-types";

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const statusClasses: Record<OrderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-sky-200 bg-sky-50 text-sky-700",
  preparing: "border-indigo-200 bg-indigo-50 text-indigo-700",
  out_for_delivery: "border-teal-200 bg-teal-50 text-teal-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

export const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

export function formatMoney(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function canCancel(status: OrderStatus) {
  return status === "pending" || status === "confirmed";
}

export function capitalize(value?: string) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11); // só 11 dígitos

  if (numbers.length <= 2) {
    return numbers.replace(/^(\d{0,2})/, "($1");
  }

  if (numbers.length <= 7) {
    return numbers.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  }

  return numbers.replace(
    /^(\d{2})(\d{5})(\d{0,4})/,
    "($1) $2-$3"
  );
}
