import { PAYMENT_METHODS, PAYMENT_LABELS, computeExpectedCash, computeShiftTotal } from '../../lib/shifts'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function ShiftSummary({ shift }) {
  if (!shift) return null
  const total = computeShiftTotal(shift)
  const expected = computeExpectedCash(shift)

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Caja abierta</p>
          <p className="text-xs text-gray-500">
            {shift.openedByName} · {formatDateTime(shift.openedAt) || '—'}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Abierta
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Fondo inicial</p>
          <p className="font-semibold">{formatCurrency(shift.openingCash ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Ventas</p>
          <p className="font-semibold">
            {shift.salesCount ?? 0} · {formatCurrency(total)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Ingresos</p>
          <p className="font-semibold">{formatCurrency(shift.cashIn ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Egresos</p>
          <p className="font-semibold">{formatCurrency(shift.cashOut ?? 0)}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-gray-500">Totales por medio de pago</p>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {PAYMENT_METHODS.map((m) => (
            <div key={m} className="flex justify-between rounded-lg bg-gray-50 px-3 py-1.5">
              <span className="text-gray-700">{PAYMENT_LABELS[m]}</span>
              <span className="font-medium">{formatCurrency(shift.totals?.[m] ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2">
        <span className="text-sm font-medium text-primary-800">Efectivo esperado</span>
        <span className="text-lg font-bold text-primary-800">{formatCurrency(expected)}</span>
      </div>
    </div>
  )
}
