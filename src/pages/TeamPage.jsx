import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import useAuth from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import Toast from '../components/ui/Toast'

export default function TeamPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'vendedor' })
  const [creating, setCreating] = useState(false)

  async function load() {
    setError('')
    try {
      const { users } = await api.listTeam()
      setUsers(users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    api
      .listTeam()
      .then(({ users }) => {
        if (!cancelled) setUsers(users)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.createMember(form)
      setForm({ email: '', password: '', displayName: '', role: 'vendedor' })
      setToast({ message: 'Colaborador creado', type: 'success' })
      load()
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(u) {
    try {
      await api.updateMember(u.id, { active: !u.active })
      load()
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  async function handleChangeRole(u, role) {
    try {
      await api.updateMember(u.id, { role })
      setToast({ message: 'Rol actualizado', type: 'success' })
      load()
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Equipo</h1>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
      >
        <h2 className="text-sm font-semibold text-gray-700">Invitar colaborador</h2>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Nombre (opcional)"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <Input
          label="Contraseña temporal"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={6}
          required
        />
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Rol
          <select
            className="rounded-lg border border-gray-200 px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Button type="submit" loading={creating}>Crear colaborador</Button>
      </form>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <h2 className="border-b border-gray-100 p-4 text-sm font-semibold text-gray-700">
          Miembros ({users.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {u.displayName || u.email}
                  </p>
                  <p className="truncate text-xs text-gray-500">{u.email}</p>
                  {!u.active && <span className="text-xs text-red-500">Inactivo</span>}
                </div>
                <select
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  value={u.role}
                  onChange={(e) => handleChangeRole(u, e.target.value)}
                  disabled={u.id === currentUser?.uid}
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleToggleActive(u)}
                  disabled={u.id === currentUser?.uid}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  {u.active ? 'Desactivar' : 'Activar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
