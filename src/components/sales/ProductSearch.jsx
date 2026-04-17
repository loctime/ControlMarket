import { useState, useMemo } from 'react'
import Input from '../ui/Input'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ProductSearch({ products, onSelect }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)))
      .slice(0, 8)
  }, [products, query])

  function handleSelect(product) {
    onSelect(product)
    setQuery('')
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar producto por nombre…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => handleSelect(p)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-xs text-gray-400">Stock: {p.stock}</span>
                </span>
                <span className="font-semibold text-primary-700">{formatCurrency(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
