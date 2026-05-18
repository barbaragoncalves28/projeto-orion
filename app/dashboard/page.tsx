"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaHome } from "react-icons/fa";
import Image from "next/image";

type DashboardData = {
  totalRevenue: number;
  averageTicket: number;
  avgDeliveryTime: number;
  ordersPerDay: {
    date: string;
    total: number;
  }[];
  topProducts: {
    productId: string;
    name: string;
    totalSold: number;
  }[];

  ordersByStatus: {
    status: string;
    total: number;
  }[];

   ordersByPaymentMethod: {
    payment_method: string;
    total: number;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    const result = await res.json();

    setData(result);

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }

  loadDashboard();
}, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-white">
        <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl mb-6 border-4 border-slate-200 animate-pulse">
          <Image
            src="/images/orion.png"
            alt="Sistema Orion"
            width={112}
            height={112}
            priority
            className="w-full h-full object-cover"
          />
        </div>

      <div className="w-12 h-12 border-4 border-zinc-700 border-t-amber-400 rounded-full animate-spin mb-4" />

      <h2 className="text-xl font-semibold">Carregando dashboard</h2>
      <p className="text-zinc-400 mt-2 text-sm">
        Aguarde enquanto buscamos seus dados...
      </p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  order_ready: "Pedido pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const translatedOrdersByStatus = data.ordersByStatus.map((item) => ({
  ...item,
  status: statusLabels[item.status] || item.status,
}));

const paymentLabels: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
};

const translatedOrdersByPaymentMethod = data.ordersByPaymentMethod.map(
  (item) => ({
    ...item,
    payment_method:
      paymentLabels[item.payment_method] || item.payment_method,
  })
);

  const COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#22c55e",
  "#ef4444",
  "#14b8a6",
];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/orders"
          className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <FaHome size={18} />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card
          title="Receita total"
          value={`R$ ${data.totalRevenue.toFixed(2)}`}
        />

        <Card
          title="Ticket médio"
          value={`R$ ${data.averageTicket.toFixed(2)}`}
        />

        <Card
          title="Tempo médio entrega"
          value={`${data.avgDeliveryTime.toFixed(0)} min`}
        />
      </div>

      {/* gráfico pedidos */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Pedidos por dia
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.ordersPerDay}>
              <XAxis dataKey="date" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* top produtos */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Produtos mais vendidos
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 grid lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
              Distribuição de pedidos por status
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={translatedOrdersByStatus}
                dataKey="total"
                nameKey="status"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
          >
              {translatedOrdersByStatus.map((entry, index) => (
              <Cell
              key={entry.status}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>

          <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
  <h2 className="text-xl font-semibold mb-4">
    Pedidos por pagamento
  </h2>

  <ResponsiveContainer width="100%" height={350}>
    <PieChart>
      <Pie
        data={translatedOrdersByPaymentMethod}
        dataKey="total"
        nameKey="payment_method"
        cx="50%"
        cy="45%"
        innerRadius={60}
        outerRadius={100}
        paddingAngle={4}
        label={({ name, percent }) =>
          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
        }
      >
        {translatedOrdersByPaymentMethod.map((entry, index) => (
          <Cell
            key={entry.payment_method}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Tooltip />
      <Legend verticalAlign="bottom" height={36} />
    </PieChart>
  </ResponsiveContainer>
</div>
    </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg">
      <p className="text-zinc-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}