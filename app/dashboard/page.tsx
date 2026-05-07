"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 shadow rounded">
          <p>Receita</p>
          <p className="text-xl font-bold">
            R$ {data.totalRevenue}
          </p>
        </div>

        <div className="p-4 shadow rounded">
          <p>Ticket médio</p>
          <p className="text-xl font-bold">
            R$ {data.averageTicket}
          </p>
        </div>

        <div className="p-4 shadow rounded">
          <p>Tempo médio entrega</p>
          <p className="text-xl font-bold">
            {data.avgDeliveryTime} min
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mt-6">
          Top produtos
        </h2>

        {data.topProducts.map((p: any) => (
          <p key={p.productId}>
            🍔 {p.name} - {p.totalSold}
          </p>
        ))}
      </div>
    </div>
  );
}