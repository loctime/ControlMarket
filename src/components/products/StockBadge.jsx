import { getStockLevel } from '../../utils/stockHelpers'

const styles = {
  ok: 'bg-green-100 text-green-800',
  low: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
}

export default function StockBadge({ stock }) {
  const level = getStockLevel(stock)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      Stock: {stock}
    </span>
  )
}
