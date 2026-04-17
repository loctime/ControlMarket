import { useState } from 'react'
import { registerSale, subscribeSalesHistory } from '../lib/firestore'
import { toDateKey } from '../utils/formatDate'
import { useEffect } from 'react'

export function useSalesHistory({ vendedorId, isAdmin }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeSalesHistory({ vendedorId, isAdmin }, (data) => {
      setSales(data)
      setLoading(false)
    })
    return unsub
  }, [vendedorId, isAdmin])

  return { sales, loading }
}

export function useRegisterSale() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit({ items, total, profit, paymentMethod, vendedorId, vendedorName }) {
    setLoading(true)
    setError(null)
    try {
      const saleId = await registerSale({
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
