import { auth } from '../firebaseAdmin.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Token faltante' })

  try {
    const decoded = await auth.verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      orgId: decoded.orgId ?? null,
      role: decoded.role ?? null,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Requiere rol admin' })
  }
  if (!req.user?.orgId) {
    return res.status(403).json({ error: 'Usuario sin organización' })
  }
  next()
}
