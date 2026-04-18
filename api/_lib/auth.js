import { getAuth } from './firebaseAdmin.js'

export async function requireAuth(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    const err = new Error('Token faltante')
    err.status = 401
    throw err
  }
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email,
      orgId: decoded.orgId ?? null,
      role: decoded.role ?? null,
    }
  } catch {
    const err = new Error('Token inválido')
    err.status = 401
    throw err
  }
}

export function requireAdmin(user) {
  if (user?.role !== 'admin') {
    const err = new Error('Requiere rol admin')
    err.status = 403
    throw err
  }
  if (!user?.orgId) {
    const err = new Error('Usuario sin organización')
    err.status = 403
    throw err
  }
}
