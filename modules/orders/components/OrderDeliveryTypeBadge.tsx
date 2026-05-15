type Props = {
  type: "delivery" | "pickup";
};

const labels = {
  delivery: "Entrega",
  pickup: "Retirada no local",
};

const styles = {
  delivery:
    "border-blue-200 bg-blue-50 text-blue-700",
  pickup:
    "border-purple-200 bg-purple-50 text-purple-700",
};

export function OrderDeliveryTypeBadge({ type }: Props) {
  return (
    <span
      className={`inline-flex w-fit rounded-md border px-3 py-1 text-xs font-medium ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}