import { useState } from 'react'
import useAuth from '../hooks/useAuth'
import useActiveShift, { useShiftsHistory } from '../hooks/useShift'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import { computeExpectedCash } from '../lib/shifts'
import OpenShiftForm from '../components/shift/OpenShiftForm'
import CloseShiftForm from '../components/shift/CloseShiftForm'
import CashMovementForm from '../components/shift/CashMovementForm'
import ShiftSummary from '../components/shift/ShiftSummary'
import Spinner from '../components/ui/Spinner'

function ShiftHistory({ orgId }) {
  const { shifts, loading } = useShiftsHistory(orgId)

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (shifts.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Sin cierres registrados</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {shifts.map((shift) => {
        const expected = computeExpectedCash(shift)
        const diff = (shift.closingCash ?? 0) - expected
        return (
          <div key={shift.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(shift.openedAt)}</p>
                <p className="text-xs text-gray-500">
                  Cerró: {formatDateTime(shift.closedAt)} · {shift.closedByName ?? shift.openedByName}
                </p>
              </div>
              {diff !== 0 && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${diff > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                <p className="text-gray-500">Fondo inicial</p>
                <p className="font-semibold">{formatCurrency(shift.openingCash ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                <p className="text-gray-500">Efectivo contado</p>
                <p className="font-semibold">{formatCurrency(shift.closingCash ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                <p className="text-gray-500">Dejó en caja</p>
                <p className="font-semibold">{formatCurrency(shift.leftInDrawer ?? 0)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ShiftPage() {
  const { orgId, role } = useAuth()
  const { shift, loading } = useActiveShift(orgId)
  const [showClose, setShowClose] = useState(false)
  const [tab, setTab] = useState('shift')
  const isAdmin = role === 'admin'

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  const movements = [...(shift?.movements ?? [])].sort((a, b) => (b.at || '').localeCompare(a.at || ''))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Caja</h1>
        {isAdmin && (
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
            <button
              className={`rounded-md px-3 py-1 font-medium transition-colors ${tab === 'shift' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              onClick={() => setTab('shift')}
            >
              Turno
            </button>
            <button
              className={`rounded-md px-3 py-1 font-medium transition-colors ${tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              onClick={() => setTab('history')}
            >
              Historial
            </button>
          </div>
        )}
      </div>

      {tab === 'history' && isAdmin ? (
        <ShiftHistory orgId={orgId} />
      ) : (
        <>
          {!shift ? (
            isAdmin ? (
              <OpenShiftForm />
            ) : (
              <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                No hay caja abierta. Un administrador debe abrirla.
              </p>
            )
          ) : (
            <>
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

              {isAdmin && (
                showClose ? (
                  <CloseShiftForm shift={shift} onClosed={() => setShowClose(false)} />
                ) : (
                  <button
                    onClick={() => setShowClose(true)}
                    className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Cerrar caja
                  </button>
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
