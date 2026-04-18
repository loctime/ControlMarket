import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getSale, getOrganization } from '../lib/firestore'
import Ticket from '../components/ticket/Ticket'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function TicketPage() {
  const { id } = useParams()
  const { orgId } = useAuth()
  const [sale, setSale] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [s, o] = await Promise.all([getSale(id), orgId ? getOrganization(orgId) : null])
        if (cancelled) return
        if (!s) {
          setError('Venta no encontrada')
          return
        }
        setSale(s)
        setOrg(o)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, orgId])

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-gray-900">Ticket</h1>
        <div className="flex gap-2">
          <Link to="/sales" className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Nueva venta
          </Link>
          <Button onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      <div className="flex justify-center print:block">
        <Ticket sale={sale} org={org} />
      </div>
    </div>
  )
}
