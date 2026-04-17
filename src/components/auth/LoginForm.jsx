import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde',
  'auth/network-request-failed': 'Sin conexión. Verificá tu red',
}

export default function LoginForm() {
  const { login, role } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
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
        autoComplete="current-password"
        required
      />
      <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
        Iniciar sesión
      </Button>
      <p className="text-center text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary-700 hover:underline">
          Crear una
        </Link>
      </p>
    </form>
  )
}
