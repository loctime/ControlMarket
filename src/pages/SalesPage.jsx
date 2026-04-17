import { useState, useCallback } from 'react'
import useAuth from '../hooks/useAuth'
import useProducts from '../hooks/useProducts'
import useCart from '../hooks/useCart'
import { useRegisterSale } from '../hooks/useSales'
import { getProductByBarcode } from '../lib/firestore'
import { filterLowStockProducts } from '../utils/stockHelpers'
import BarcodeScanner from '../components/sales/BarcodeScanner'
import ProductSearch from '../components/sales/ProductSearch'
import CartItem from '../components/sales/CartItem'
import CartSummary from '../components/sales/CartSummary'
import Toast from '../components/ui/Toast'
import Alert from '../components/ui/Alert'

const TABS = ['scanner', 'buscar']

export default function SalesPage() {
  const { currentUser, orgId } = useAuth()
  const { products } = useProducts()
  const { items, addItem, updateQty, removeItem, clearCart, cartTotal, cartProfit } = useCart()
  const { submit, loading } = useRegisterSale()
  const [tab, setTab] = useState('buscar')
  const [toast, setToast] = useState(null)
  const [lowStock, setLowStock] = useState([])

  const handleBarcode = useCallback(async (barcode) => {
    const product = await getProductByBarcode(orgId, barcode)
    if (!product) {
      setToast({ message: `Código ${barcode} no encontrado`, type: 'error' })
      return
    }
    addItem(product)
    setToast({ message: `${product.name} agregado`, type: 'success' })
  }, [addItem, orgId])

  async function handleConfirm(paymentMethod) {
    if (items.length === 0) return
    try {
      await submit({
        orgId,
        items,
        total: cartTotal,
        profit: cartProfit,
        paymentMethod,
        vendedorId: currentUser.uid,
        vendedorName: currentUser.displayName || currentUser.email,
      })
      const low = filterLowStockProducts(
        products.filter((p) => items.some((i) => i.productId === p.id))
      )
      setLowStock(low)
      clearCart()
      setToast({ message: `Venta registrada: $${cartTotal.toFixed(2)}`, type: 'success' })
    } catch {
      setToast({ message: 'Error al registrar la venta', type: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Registrar venta</h1>

      {lowStock.length > 0 && (
        <Alert type="warning" onClose={() => setLowStock([])}>
          Stock bajo: {lowStock.map((p) => `${p.name} (${p.stock})`).join(', ')}
        </Alert>
      )}

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t === 'scanner' ? 'Escáner' : 'Búsqueda'}
          </button>
        ))}
      </div>

      {tab === 'scanner' ? (
        <BarcodeScanner active={tab === 'scanner'} onDetected={handleBarcode} />
      ) : (
        <ProductSearch products={products} onSelect={(p) => addItem(p)} />
      )}

      {items.length > 0 && (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Carrito ({items.length})</h2>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          <CartSummary
            total={cartTotal}
            onConfirm={handleConfirm}
            loading={loading}
            disabled={items.length === 0}
          />
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
