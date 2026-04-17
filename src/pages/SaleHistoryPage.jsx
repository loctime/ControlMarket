import useAuth from '../hooks/useAuth'
import { useSalesHistory } from '../hooks/useSales'
import SalesList from '../components/sales/SalesList'
import Spinner from '../components/ui/Spinner'

export default function SaleHistoryPage() {
  const { currentUser, role } = useAuth()
  const isAdmin = role === 'admin'
  const { sales, loading } = useSalesHistory({
    vendedorId: currentUser?.uid,
    isAdmin,
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">
        {isAdmin ? 'Historial de ventas' : 'Mis ventas'}
      </h1>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <SalesList sales={sales} />
      )}
    </div>
  )
}
