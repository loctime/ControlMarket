import { Link } from 'react-router-dom'
import StockBadge from './StockBadge'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-primary-200 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500">{product.category}</p>
        </div>
        <StockBadge stock={product.stock} />
      </div>
      <p className="mt-2 text-lg font-bold text-primary-700">{formatCurrency(product.price)}</p>
    </Link>
  )
}
