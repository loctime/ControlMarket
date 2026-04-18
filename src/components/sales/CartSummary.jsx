import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../ui/Button'

export default function CartSummary({ total, onCharge, disabled, shiftOpen }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-2xl font-bold text-primary-700">{formatCurrency(total)}</span>
      </div>

      {!shiftOpen && (
        <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          No hay caja abierta. Abrí una caja para registrar ventas.
        </p>
      )}

      <Button
        className="w-full"
        onClick={onCharge}
        disabled={disabled || !shiftOpen}
        size="lg"
      >
        Cobrar
      </Button>
    </div>
  )
}
