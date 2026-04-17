import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { addProduct, updateProduct, softDeleteProduct, getCategories } from '../lib/firestore'
import ProductForm from '../components/products/ProductForm'
import Spinner from '../components/ui/Spinner'
import Toast from '../components/ui/Toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const isNew = id === 'new'

  useEffect(() => {
    getCategories().then(setCategories)
    if (!isNew) {
      getDoc(doc(db, 'products', id)).then((snap) => {
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() })
      })
    }
  }, [id, isNew])

  async function handleSubmit(data) {
    setLoading(true)
    try {
      if (isNew) {
        await addProduct(data)
        setToast({ message: 'Producto agregado', type: 'success' })
        setTimeout(() => navigate('/products'), 1000)
      } else {
        await updateProduct(id, data)
        setToast({ message: 'Producto actualizado', type: 'success' })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto?')) return
    await softDeleteProduct(id)
    navigate('/products')
  }

  if (!isNew && !product) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? 'Nuevo producto' : 'Editar producto'}
      </h1>
      <ProductForm
        initial={product ?? {}}
        categories={categories}
        onSubmit={handleSubmit}
        onDelete={isNew ? undefined : handleDelete}
        loading={loading}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
