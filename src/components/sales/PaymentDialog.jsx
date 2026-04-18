import { useMemo, useState } from 'react'
import { PAYMENT_METHODS, PAYMENT_LABELS } from '../../lib/shifts'
import { formatCurrency } from '../../utils/formatCurrency'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

export default function PaymentDialog({ open, onClose, total, onConfirm, loading }) {
  const [mode, setMode] = useState('single')
  const [method, setMethod] = useState('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [splits, setSplits] = useState([
    { method: 'efectivo', amount: '' },
    { method: 'debito', amount: '' },
  ])

  const change = useMemo(() => {
    if (mode !== 'single' || method !== 'efectivo') return 0
    const received = Number(cashReceived)
    if (!Number.isFinite(received)) return 0
    return round2(received - total)
  }, [mode, method, cashReceived, total])

  const splitPaid = useMemo(
    () => round2(splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)),
    [splits]
  )
  const splitRemaining = useMemo(() => round2(total - splitPaid), [total, splitPaid])

  function updateSplit(i, patch) {
    setSplits((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function addSplit() {
    setSplits((prev) => [...prev, { method: 'credito', amount: '' }])
  }
  function removeSplit(i) {
    setSplits((prev) => prev.filter((_, idx) => idx !== i))
  }

  const canConfirm = useMemo(() => {
    if (loading) return false
    if (mode === 'single') {
      if (method !== 'efectivo') return true
      const received = Number(cashReceived)
      return Number.isFinite(received) && received >= total
    }
    const valid = splits.every((s) => Number(s.amount) > 0)
    return valid && Math.abs(splitPaid - total) < 0.01
  }, [mode, method, cashReceived, total, splits, splitPaid, loading])

  function handleConfirm() {
    if (mode === 'single') {
      const payments = [{ method, amount: round2(total) }]
      const received = method === 'efectivo' ? round2(Number(cashReceived)) : null
      const chg = method === 'efectivo' ? change : null
      onConfirm({ payments, cashReceived: received, change: chg })
      return
    }
    const payments = splits.map((s) => ({ method: s.method, amount: round2(Number(s.amount)) }))
    onConfirm({ payments, cashReceived: null, change: null })
  }

  return (
    <Modal open={open} onClose={onClose} title="Cobrar venta">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Total a cobrar</span>
          <span className="text-xl font-bold text-primary-700">{formatCurrency(total)}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              mode === 'single' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Un método
          </button>
          <button
            onClick={() => setMode('split')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              mode === 'split' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pago dividido
          </button>
        </div>

        {mode === 'single' ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                    method === m ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {PAYMENT_LABELS[m]}
                </button>
              ))}
            </div>

            {method === 'efectivo' && (
              <>
                <Input
                  label="Recibe"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={total.toFixed(2)}
                />
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-sm text-green-800">Vuelto</span>
                  <span className="text-lg font-bold text-green-800">
                    {formatCurrency(Math.max(0, change))}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {splits.map((s, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Método</label>
                  <select
                    value={s.method}
                    onChange={(e) => updateSplit(i, { method: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    label="Monto"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={s.amount}
                    onChange={(e) => updateSplit(i, { amount: e.target.value })}
                  />
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => removeSplit(i)}
                    className="mb-0.5 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
                    aria-label="Quitar método"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addSplit}
              className="rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              + agregar método
            </button>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-600">
                {splitRemaining > 0 ? 'Falta' : splitRemaining < 0 ? 'Excede' : 'Completo'}
              </span>
              <span className={`font-bold ${splitRemaining === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                {formatCurrency(Math.abs(splitRemaining))}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!canConfirm} className="flex-1">
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
