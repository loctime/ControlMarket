import { useState, useEffect } from 'react'
import { getDailySales, getWeeklySales } from '../lib/firestore'
import { toDateKey, getLast7DaysKeys } from '../utils/formatDate'
import useAuth from '../hooks/useAuth'
import useProducts from '../hooks/useProducts'
import DailySalesCard from '../components/dashboard/DailySalesCard'
import DailyProfitCard from '../components/dashboard/DailyProfitCard'
import LowStockAlert from '../components/dashboard/LowStockAlert'
import SalesChart from '../components/dashboard/SalesChart'

export default function DashboardPage() {
  const { orgId } = useAuth()
  const { products } = useProducts()
  const [dailyStats, setDailyStats] = useState({ total: 0, profit: 0, count: 0 })
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    const today = toDateKey()
    const sevenDaysAgo = getLast7DaysKeys()[0]

    Promise.all([getDailySales(orgId, today), getWeeklySales(orgId, sevenDaysAgo)]).then(
      ([daily, weekly]) => {
        const total = daily.reduce((s, sale) => s + sale.total, 0)
        const profit = daily.reduce((s, sale) => s + sale.profit, 0)
        setDailyStats({ total, profit, count: daily.length })

        const grouped = getLast7DaysKeys().map((key) => {
          const daySales = weekly.filter((s) => s.dateKey === key)
          return { dateKey: key, total: daySales.reduce((s, sale) => s + sale.total, 0) }
        })
        setWeeklyData(grouped)
        setLoading(false)
      }
    )
  }, [orgId])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Panel de control</h1>

      <div className="grid grid-cols-2 gap-3">
        <DailySalesCard total={dailyStats.total} count={dailyStats.count} loading={loading} />
        <DailyProfitCard profit={dailyStats.profit} loading={loading} />
      </div>

      <LowStockAlert products={products} />

      <SalesChart data={weeklyData} />
    </div>
  )
}
