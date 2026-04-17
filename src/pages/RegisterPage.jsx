import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { api } from '../lib/api'
import useAuth from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

export default function RegisterPage() {
  const { currentUser, loading: authLoading, refreshClaims } = useAuth()
  const navigate = useNavigate()
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, currentUser, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register({ nombreEmpresa, email, password, displayName: displayName || undefined })
      await signInWithEmailAndPassword(auth, email, password)
      await refreshClaims()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary-800">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">Registrá tu negocio en ControlMarket</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          <Input
            label="Nombre del negocio"
            value={nombreEmpresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            autoComplete="organization"
            required
          />
          <Input
            label="Tu nombre (opcional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/" className="font-medium text-primary-700 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
