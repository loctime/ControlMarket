import { Link } from 'react-router-dom'
import useProducts from '../hooks/useProducts'
import ProductList from '../components/products/ProductList'
import Spinner from '../components/ui/Spinner'

export default function ProductsPage() {
  const { products, loading } = useProducts()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <Link
          to="/products/new"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white shadow hover:bg-primary-700"
        >
          +
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  )
}
