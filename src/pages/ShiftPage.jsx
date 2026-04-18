import { useState } from 'react'
import useAuth from '../hooks/useAuth'
import useActiveShift from '../hooks/useShift'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import OpenShiftForm from '../components/shift/OpenShiftForm'
import CloseShiftForm from '../components/shift/CloseShiftForm'
import CashMovementForm from '../components/shift/CashMovementForm'
import ShiftSummary from '../components/shift/ShiftSummary'
import Spinner from '../components/ui/Spinner'

export default function ShiftPage() {
  const { orgId, role } = useAuth()
  const { shift, loading } = useActiveShift(orgId)
  const [showClose, setShowClose] = useState(false)
  const isAdmin = role === 'admin'

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  if (!shift) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Caja</h1>
        {isAdmin ? (
          <OpenShiftForm />
        ) : (
          <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            No hay caja abierta. Un administrador debe abrirla.
          </p>
        )}
      </div>
    )
  }

  const movements = [...(shift.movements ?? [])].sort((a, b) => (b.at || '').localeCompare(a.at || ''))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Caja</h1>

      <ShiftSummary shift={shift} />

      <CashMovementForm shiftId={shift.id} />

      {movements.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Movimientos ({movements.length})</h2>
          <ul className="divide-y divide-gray-100">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {m.type === 'in' ? 'Ingreso' : 'Egreso'}
                    {m.reason ? ` · ${m.reason}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {m.byName} · {formatDateTime(m.at)}
                  </p>
                </div>
                <span className={`font-semibold ${m.type === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                  {m.type === 'in' ? '+' : '−'}
                  {formatCurrency(m.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin &&
        (showClose ? (
          <CloseShiftForm shift={shift} onClosed={() => setShowClose(false)} />
        ) : (
          <button
            onClick={() => setShowClose(true)}
            className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Cerrar caja
          </button>
        ))}
    </div>
  )
}
