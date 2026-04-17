import { formatCurrency } from '../../utils/formatCurrency'

export default function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} c/u</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg font-bold hover:bg-gray-200"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg font-bold hover:bg-gray-200"
        >
          +
        </button>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
        <button onClick={() => onRemove(item.productId)} className="text-xs text-red-500 hover:text-red-700">
          Quitar
        </button>
      </div>
    </div>
  )
}
