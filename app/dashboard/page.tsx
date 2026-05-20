'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaHome } from 'react-icons/fa'
import type { PieLabelRenderProps } from 'recharts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const RADIAN = Math.PI / 180
const SMALL_SCREEN_QUERY = '(max-width: 639px)'

function truncateChartLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
}: PieLabelRenderProps) {
  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    typeof midAngle !== 'number' ||
    typeof outerRadius !== 'number' ||
    typeof percent !== 'number' ||
    percent < 0.01
  ) {
    return null
  }

  const isRightSide = Math.cos(-midAngle * RADIAN) >= 0
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const label = `${truncateChartLabel(String(name ?? ''), 10)} ${(
    percent * 100
  ).toFixed(0)}%`

  return (
    <text
      x={x}
      y={y}
      fill="#e4e4e7"
      fontSize={11}
      fontWeight={600}
      textAnchor={isRightSide ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {label}
    </text>
  )
}

function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY)
    const updateScreenSize = () => setIsSmallScreen(mediaQuery.matches)

    updateScreenSize()
    mediaQuery.addEventListener('change', updateScreenSize)

    return () => mediaQuery.removeEventListener('change', updateScreenSize)
  }, [])

  return isSmallScreen
}

type DashboardData = {
  totalRevenue: number
  averageTicket: number
  avgDeliveryTime: number
  ordersPerDay: {
    date: string
    total: number
  }[]
  topProducts: {
    productId: string
    name: string
    totalSold: number
  }[]

  ordersByStatus: {
    status: string
    total: number
  }[]

  ordersByPaymentMethod: {
    payment_method: string
    total: number
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const isSmallScreen = useIsSmallScreen()

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch('/api/dashboard')
      const result = await res.json()

      setData(result)

      setTimeout(() => {
        setLoading(false)
      }, 1500)
    }

    loadDashboard()
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-2xl mb-6 border-4 border-slate-200 animate-pulse">
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
    )
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    order_ready: 'Pedido pronto',
    out_for_delivery: 'Saiu para entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }

  const translatedOrdersByStatus = data.ordersByStatus.map((item) => ({
    ...item,
    status: statusLabels[item.status] || item.status,
  }))

  const paymentLabels: Record<string, string> = {
    credito: 'Crédito',
    debito: 'Débito',
    dinheiro: 'Dinheiro',
    pix: 'Pix',
  }

  const translatedOrdersByPaymentMethod = data.ordersByPaymentMethod.map(
    (item) => ({
      ...item,
      payment_method: paymentLabels[item.payment_method] || item.payment_method,
    }),
  )

  const COLORS = [
    '#f59e0b',
    '#3b82f6',
    '#8b5cf6',
    '#22c55e',
    '#ef4444',
    '#14b8a6',
  ]

  const axisTickFormatter = (value: string | number) =>
    truncateChartLabel(String(value), isSmallScreen ? 8 : 14)

  const pieChartMargin = isSmallScreen
    ? { top: 8, right: 8, bottom: 28, left: 8 }
    : { top: 8, right: 96, bottom: 28, left: 96 }

  const legendStyle = {
    fontSize: '12px',
    lineHeight: '18px',
    paddingTop: '8px',
    whiteSpace: 'normal',
  } satisfies React.CSSProperties

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white p-4 sm:p-6 lg:p-8">
      <style jsx global>{`
        .dashboard-chart .recharts-wrapper:focus,
        .dashboard-chart .recharts-wrapper *:focus,
        .dashboard-chart .recharts-surface:focus,
        .dashboard-chart .recharts-sector:focus {
          outline: none !important;
        }
      `}</style>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-chart min-w-0 overflow-hidden bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-lg">
          <h2 className="mb-4 text-base sm:text-lg lg:text-xl font-semibold">
            Pedidos por dia
          </h2>

          <ResponsiveContainer width="100%" height={isSmallScreen ? 260 : 300}>
            <LineChart
              data={data.ordersPerDay}
              margin={{ top: 8, right: 12, bottom: 8, left: -12 }}
            >
              <XAxis
                dataKey="date"
                stroke="#a1a1aa"
                tick={{ fontSize: 11 }}
                tickFormatter={axisTickFormatter}
              />
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
        <div className="dashboard-chart min-w-0 overflow-hidden bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-lg">
          <h2 className="mb-4 text-base sm:text-lg lg:text-xl font-semibold">
            Produtos mais vendidos
          </h2>

          <ResponsiveContainer width="100%" height={isSmallScreen ? 300 : 320}>
            <BarChart
              data={data.topProducts}
              margin={{ top: 8, right: 12, bottom: 8, left: -12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                tickFormatter={axisTickFormatter}
              />
              <YAxis stroke="#a1a1aa" />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="dashboard-chart min-w-0 overflow-hidden bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-lg">
            <h2 className="mb-4 text-base sm:text-lg lg:text-xl font-semibold">
              Distribuição de pedidos por status
            </h2>

            <ResponsiveContainer
              width="100%"
              height={isSmallScreen ? 280 : 350}
            >
              <PieChart margin={pieChartMargin}>
                <Pie
                  data={translatedOrdersByStatus}
                  dataKey="total"
                  nameKey="status"
                  cx="50%"
                  cy="43%"
                  innerRadius="42%"
                  outerRadius="68%"
                  paddingAngle={4}
                  label={isSmallScreen ? false : renderPieLabel}
                  labelLine={!isSmallScreen}
                  rootTabIndex={-1}
                >
                  {translatedOrdersByStatus.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  wrapperStyle={legendStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-chart min-w-0 overflow-hidden bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-lg">
            <h2 className="mb-4 text-base sm:text-lg lg:text-xl font-semibold">
              Pedidos por pagamento
            </h2>

            <ResponsiveContainer
              width="100%"
              height={isSmallScreen ? 280 : 350}
            >
              <PieChart margin={pieChartMargin}>
                <Pie
                  data={translatedOrdersByPaymentMethod}
                  dataKey="total"
                  nameKey="payment_method"
                  cx="50%"
                  cy="43%"
                  innerRadius="42%"
                  outerRadius="68%"
                  paddingAngle={4}
                  label={isSmallScreen ? false : renderPieLabel}
                  labelLine={!isSmallScreen}
                  rootTabIndex={-1}
                >
                  {translatedOrdersByPaymentMethod.map((entry, index) => (
                    <Cell
                      key={entry.payment_method}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  wrapperStyle={legendStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-lg">
      <p className="text-sm sm:text-base text-zinc-400">{title}</p>
      <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold wrap-break-word leading-tight">
        {value}
      </h2>
    </div>
  )
}
