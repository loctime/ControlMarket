import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/sales" replace />
  }

  return children
}
