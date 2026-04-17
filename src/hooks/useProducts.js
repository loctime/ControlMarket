import { useState, useEffect } from 'react'
import { subscribeProducts } from '../lib/firestore'

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = subscribeProducts((data) => {
      setProducts(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { products, loading, error }
}
