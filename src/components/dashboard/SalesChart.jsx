import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatCurrency'

function formatKey(dateKey) {
  const [, , day] = dateKey.split('-')
  return `${parseInt(day)}`
}

export default function SalesChart({ data }) {
  const chartData = data.map((d) => ({ day: formatKey(d.dateKey), total: d.total }))

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="mb-3 text-sm font-semibold text-gray-700">Últimos 7 días</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
