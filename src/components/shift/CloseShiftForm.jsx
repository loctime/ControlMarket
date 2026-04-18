import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { closeShift, computeExpectedCash } from '../../lib/shifts'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CloseShiftForm({ shift, onClosed }) {
  const { currentUser } = useAuth()
  const [closingCash, setClosingCash] = useState('')
  const [leftInDrawer, setLeftInDrawer] = useState('0')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const expected = computeExpectedCash(shift)
  const counted = Number(closingCash) || 0
  const left = Number(leftInDrawer) || 0
  const diff = closingCash !== '' ? counted - expected : null
  const withdrawn = closingCash !== '' ? counted - left : null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await closeShift({
        shiftId: shift.id,
        closingCash: counted,
        leftInDrawer: left,
        user: currentUser,
        notes,
      })
      onClosed?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">Cerrar caja (arqueo)</h2>
      <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm">
        <span className="text-primary-800">Efectivo esperado</span>
        <span className="font-bold text-primary-800">{formatCurrency(expected)}</span>
      </div>
      <Input
        label="Efectivo contado"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={closingCash}
        onChange={(e) => setClosingCash(e.target.value)}
        required
      />
      {diff !== null && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            diff === 0 ? 'bg-green-50 text-green-800' : diff > 0 ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <span>{diff === 0 ? 'Sin diferencia' : diff > 0 ? 'Sobrante' : 'Faltante'}</span>
          <span className="font-bold">{diff === 0 ? '—' : formatCurrency(Math.abs(diff))}</span>
        </div>
      )}
      <Input
        label="¿Cuánto dejás en caja para el próximo turno?"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={leftInDrawer}
        onChange={(e) => setLeftInDrawer(e.target.value)}
      />
      {withdrawn !== null && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span>Vas a retirar</span>
          <span className="font-bold">{formatCurrency(Math.max(0, withdrawn))}</span>
        </div>
      )}
      <Input
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" loading={loading} variant="danger">Cerrar caja</Button>
    </form>
  )
}
