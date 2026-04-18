import { useState, useMemo } from 'react'
import useAuth from '../hooks/useAuth'
import { useSalesHistory } from '../hooks/useSales'
import SalesList from '../components/sales/SalesList'
import Spinner from '../components/ui/Spinner'
import { PAYMENT_METHODS, PAYMENT_LABELS } from '../lib/shifts'
import { toDateKey } from '../utils/formatDate'

const DATE_OPTIONS = [
  { label: 'Hoy', value: 'today' },
  { label: '7 días', value: '7d' },
  { label: '30 días', value: '30d' },
  { label: 'Todo', value: 'all' },
]

function getMinDateKey(filter) {
  if (filter === 'today') return toDateKey()
  const d = new Date()
  d.setDate(d.getDate() - (filter === '7d' ? 7 : 30))
  return toDateKey(d)
}

export default function SaleHistoryPage() {
  const { currentUser, role, orgId } = useAuth()
  const isAdmin = role === 'admin'
  const { sales, loading } = useSalesHistory({
    orgId,
    vendedorId: currentUser?.uid,
    isAdmin,
  })

  const [dateFilter, setDateFilter] = useState('today')
  const [methodFilter, setMethodFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = sales
    if (dateFilter !== 'all') {
      const minKey = getMinDateKey(dateFilter)
      result = result.filter((s) => s.dateKey >= minKey)
    }
    if (methodFilter !== 'all') {
      result = result.filter((s) => s.paymentMethod === methodFilter)
    }
    return result
  }, [sales, dateFilter, methodFilter])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">
        {isAdmin ? 'Historial de ventas' : 'Mis ventas'}
      </h1>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1 flex-wrap">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                dateFilter === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setMethodFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              methodFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                methodFilter === m
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {PAYMENT_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <SalesList sales={filtered} />
      )}
    </div>
  )
}
