import { auth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function apiFetch(path, { method = 'GET', body, auth: withAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (withAuth) {
    const user = auth.currentUser
    if (!user) throw new Error('No hay sesión activa')
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    err.details = data.details
    throw err
  }
  return data
}

export const api = {
  register: (body) => apiFetch('/api/register', { method: 'POST', body, auth: false }),
  listTeam: () => apiFetch('/api/team'),
  createMember: (body) => apiFetch('/api/team', { method: 'POST', body }),
  updateMember: (uid, body) => apiFetch(`/api/team/${uid}`, { method: 'PATCH', body }),
  deactivateMember: (uid) => apiFetch(`/api/team/${uid}`, { method: 'DELETE' }),
}
