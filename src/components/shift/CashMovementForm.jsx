import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { addCashMovement } from '../../lib/shifts'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CashMovementForm({ shiftId }) {
  const { currentUser } = useAuth()
  const [type, setType] = useState('in')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await addCashMovement({
        shiftId,
        type,
        amount,
        reason,
        user: currentUser,
      })
      setAmount('')
      setReason('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">Movimiento de efectivo</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('in')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === 'in' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => setType('out')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Egreso
        </button>
      </div>
      <Input
        label="Monto"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Input
        label="Motivo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Retiro, proveedor, etc."
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" loading={loading} variant={type === 'in' ? 'primary' : 'danger'}>
        Registrar {type === 'in' ? 'ingreso' : 'egreso'}
      </Button>
    </form>
  )
}
