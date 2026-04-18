import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ScanResultDialog({ product, onConfirm, onCancel }) {
  const [qty, setQty] = useState(1)
  const inputRef = useRef(null)

  useEffect(() => {
    setQty(1)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [product?.id])

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  if (!product) return null

  function handleSubmit(e) {
    e.preventDefault()
    const n = Math.max(1, Math.floor(Number(qty) || 1))
    onConfirm(product, n)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {formatCurrency(product.price)} · stock {product.stock}
          {product.barcode ? ` · ${product.barcode}` : ''}
        </p>

        <div className="mt-4 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Cantidad</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              aria-label="Restar"
            >
              −
            </button>
            <input
              ref={inputRef}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-semibold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setQty((q) => Number(q) + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              aria-label="Sumar"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            Agregar
          </Button>
        </div>
      </form>
    </div>
  )
}
