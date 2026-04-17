import { Link } from 'react-router-dom'
import { filterLowStockProducts } from '../../utils/stockHelpers'

export default function LowStockAlert({ products }) {
  const low = filterLowStockProducts(products)
  if (low.length === 0) return null

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <p className="mb-2 text-sm font-semibold text-yellow-800">
        Stock bajo ({low.length} producto{low.length !== 1 ? 's' : ''})
      </p>
      <ul className="flex flex-col gap-1">
        {low.map((p) => (
          <li key={p.id} className="flex items-center justify-between">
            <span className="text-sm text-yellow-900">{p.name}</span>
            <Link
              to={`/products/${p.id}`}
              className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
            >
              Stock: {p.stock} → Editar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
