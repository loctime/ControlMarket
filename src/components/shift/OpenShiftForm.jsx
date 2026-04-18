import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { openShift } from '../../lib/shifts'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function OpenShiftForm({ onOpened }) {
  const { orgId, currentUser } = useAuth()
  const [openingCash, setOpeningCash] = useState('0')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await openShift({
        orgId,
        openingCash: Number(openingCash),
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
