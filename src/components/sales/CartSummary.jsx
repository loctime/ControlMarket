import { useState } from 'react'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../ui/Button'

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia']

export default function CartSummary({ total, onConfirm, loading, disabled }) {
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-2xl font-bold text-primary-700">{formatCurrency(total)}</span>
      </div>

      <div className="mb-4 flex gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setPaymentMethod(m)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
              paymentMethod === m
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => onConfirm(paymentMethod)}
        loading={loading}
        disabled={disabled}
        size="lg"
      >
        Confirmar venta
      </Button>
    </div>
  )
}
