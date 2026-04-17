import Card from '../ui/Card'
import { formatCurrency } from '../../utils/formatCurrency'

export default function DailySalesCard({ total, count, loading }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ventas del día</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold text-primary-700">{formatCurrency(total)}</p>
          <p className="text-sm text-gray-500">{count} transacción{count !== 1 ? 'es' : ''}</p>
        </>
      )}
    </Card>
  )
}
