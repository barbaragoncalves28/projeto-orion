"use client";

export function OrderSessionFields({
  userId,
  role,
  onChange,
}: {
  userId: string;
  role: "customer" | "vendor" | "admin";
  onChange: (next: { userId: string; role: "customer" | "vendor" | "admin" }) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Usuário</span>
        <input
          value={userId}
          onChange={(event) => onChange({ userId: event.target.value, role })}
          placeholder="UUID do usuário"
          className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Perfil</span>
        <select
          value={role}
          onChange={(event) =>
            onChange({
              userId,
              role: event.target.value as "customer" | "vendor" | "admin",
            })
          }
          className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
        >
          <option value="customer">Cliente</option>
          <option value="vendor">Restaurante</option>
          <option value="admin">Admin</option>
        </select>
      </label>
    </div>
  );
}
