import { useState, useEffect } from 'react'
import { registerSale, subscribeSalesHistory } from '../lib/firestore'
import { toDateKey } from '../utils/formatDate'

export function useSalesHistory({ orgId, vendedorId, isAdmin }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeSalesHistory({ orgId, vendedorId, isAdmin }, (data) => {
      setSales(data)
      setLoading(false)
    })
    return unsub
  }, [orgId, vendedorId, isAdmin])

  return { sales, loading }
}

export function useRegisterSale() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit({ orgId, items, total, profit, paymentMethod, vendedorId, vendedorName }) {
    setLoading(true)
    setError(null)
    try {
      const saleId = await registerSale({
        orgId,
        items,
        total,
        profit,
        paymentMethod,
        vendedorId,
        vendedorName,
        dateKey: toDateKey(),
      })
      return saleId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}
