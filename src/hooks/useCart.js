import { useState, useCallback } from 'react'

export default function useCart() {
  const [items, setItems] = useState([])

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.unitPrice }
            : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode || '',
          unitPrice: product.price,
          costPrice: product.costPrice || 0,
          quantity,
          subtotal: product.price * quantity,
        },
      ]
    })
  }, [])

  const updateQty = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity, subtotal: quantity * i.unitPrice } : i
      )
    )
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const cartTotal = items.reduce((sum, i) => sum + i.subtotal, 0)
  const cartProfit = items.reduce((sum, i) => sum + (i.unitPrice - i.costPrice) * i.quantity, 0)

  return { items, addItem, updateQty, removeItem, clearCart, cartTotal, cartProfit }
}
