import { useState } from 'react'
import { Link } from 'react-router-dom'
import useProducts from '../hooks/useProducts'
import ProductList from '../components/products/ProductList'
import BulkImportModal from '../components/products/BulkImportModal'
import Spinner from '../components/ui/Spinner'
import { downloadProductTemplate } from '../utils/productTemplate'

export default function ProductsPage() {
  const { products, loading } = useProducts()
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadProductTemplate}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Plantilla
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Importar
          </button>
          <Link
            to="/products/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white shadow hover:bg-primary-700"
            aria-label="Nuevo producto"
          >
            +
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <ProductList products={products} />
      )}

      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
