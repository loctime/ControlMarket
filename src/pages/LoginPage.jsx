import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import LoginForm from '../components/auth/LoginForm'
import Spinner from '../components/ui/Spinner'

export default function LoginPage() {
  const { currentUser, role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(role === 'admin' ? '/dashboard' : '/sales', { replace: true })
    }
  }, [currentUser, role, loading, navigate])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-800">ControlMarket</h1>
          <p className="mt-1 text-sm text-gray-500">Sistema de gestión para kiosco</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
