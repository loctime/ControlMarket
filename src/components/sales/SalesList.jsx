import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import Badge from '../ui/Badge'

export default function SalesList({ sales }) {
  const [expanded, setExpanded] = useState(null)

  if (sales.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No hay ventas registradas</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {sales.map((sale) => (
        <div key={sale.id} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <button
            className="flex w-full items-center justify-between p-4 text-left"
            onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(sale.createdAt)}</p>
              <p className="text-xs text-gray-500">
                {sale.vendedorName} · {sale.items?.length ?? 0} ítem(s) · <span className="capitalize">{sale.paymentMethod}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary-700">{formatCurrency(sale.total)}</p>
              <Badge variant={sale.status === 'completed' ? 'green' : 'gray'}>
                {sale.status === 'completed' ? 'Completada' : sale.status}
              </Badge>
            </div>
          </button>

          {expanded === sale.id && sale.items && (
            <div className="border-t border-gray-100 px-4 pb-3">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1 text-xs text-gray-700">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <Link
                to={`/sales/ticket/${sale.id}`}
                className="mt-2 inline-block text-xs font-medium text-primary-600 hover:underline"
              >
                Ver ticket →
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
