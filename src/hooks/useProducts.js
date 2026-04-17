import { useState, useEffect } from 'react'
import { subscribeProducts } from '../lib/firestore'
import useAuth from './useAuth'

export default function useProducts() {
  const { orgId } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeProducts(orgId, (data) => {
      setProducts(data)
      setLoading(false)
    })
    return unsub
  }, [orgId])

  return { products, loading, error }
}
