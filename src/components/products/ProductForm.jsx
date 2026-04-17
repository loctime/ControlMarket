import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

const UNITS = ['pieza', 'kg', 'litro', 'paquete', 'caja']

export default function ProductForm({ initial = {}, categories = [], onSubmit, onDelete, loading }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    price: initial.price ?? '',
    costPrice: initial.costPrice ?? '',
    stock: initial.stock ?? '',
    category: initial.category ?? '',
    barcode: initial.barcode ?? '',
    unit: initial.unit ?? 'pieza',
    active: initial.active ?? true,
  })
  const [error, setError] = useState('')

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || form.price === '' || form.stock === '') {
      setError('Nombre, precio y stock son obligatorios')
      return
    }
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        costPrice: Number(form.costPrice) || 0,
        stock: Number(form.stock),
      })
    } catch {
      setError('Error al guardar el producto')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <Input label="Nombre *" value={form.name} onChange={set('name')} required />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio de venta *" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
        <Input label="Precio de costo" type="number" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Stock *" type="number" min="0" value={form.stock} onChange={set('stock')} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Unidad</label>
          <select
            value={form.unit}
            onChange={set('unit')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Categoría</label>
        <select
          value={form.category}
          onChange={set('category')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => <option key={c.id ?? c} value={c.name ?? c}>{c.name ?? c}</option>)}
        </select>
      </div>

      <Input label="Código de barras (opcional)" value={form.barcode} onChange={set('barcode')} />

      {initial.id && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            className="rounded"
          />
          Producto activo
        </label>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial.id ? 'Guardar cambios' : 'Agregar producto'}
        </Button>
        {onDelete && (
          <Button type="button" variant="danger" onClick={onDelete}>Eliminar</Button>
        )}
      </div>
    </form>
  )
}
