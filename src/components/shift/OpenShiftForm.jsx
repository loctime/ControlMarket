import { useState, useEffect } from 'react'
import useAuth from '../../hooks/useAuth'
import { openShift, getLastClosedShift } from '../../lib/shifts'
import { formatCurrency } from '../../utils/formatCurrency'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function OpenShiftForm({ onOpened }) {
  const { orgId, currentUser } = useAuth()
  const [openingCash, setOpeningCash] = useState('0')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastShift, setLastShift] = useState(null)

  useEffect(() => {
    getLastClosedShift(orgId).then(setLastShift)
  }, [orgId])

  const previousLeft = lastShift?.leftInDrawer ?? null
  const entered = Number(openingCash) || 0
  const openingDiff = previousLeft !== null ? entered - previousLeft : null

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await openShift({
        orgId,
        openingCash: entered,
        user: currentUser,
        notes,
      })
      onOpened?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">Abrir caja</h2>
      {previousLeft !== null && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
          <span className="text-blue-800">La caja anterior dejó</span>
          <span className="font-bold text-blue-800">{formatCurrency(previousLeft)}</span>
        </div>
      )}
      <Input
        label="Fondo inicial en efectivo"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={openingCash}
        onChange={(e) => setOpeningCash(e.target.value)}
        required
      />
      {openingDiff !== null && openingDiff !== 0 && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
            openingDiff > 0 ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <span>{openingDiff > 0 ? 'Sobrante vs caja anterior' : 'Faltante vs caja anterior'}</span>
          <span className="font-bold">{formatCurrency(Math.abs(openingDiff))}</span>
        </div>
      )}
      <Input
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Turno mañana, etc."
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" loading={loading}>Abrir caja</Button>
    </form>
  )
}
