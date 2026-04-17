import { z } from 'zod'
import { auth, db, FieldValue } from '../_lib/firebaseAdmin.js'
import { requireAuth, requireAdmin } from '../_lib/auth.js'

const patchSchema = z.object({
  role: z.enum(['admin', 'vendedor']).optional(),
  active: z.boolean().optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
})

export default async function handler(req, res) {
  let user
  try {
    user = await requireAuth(req)
    requireAdmin(user)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }

  const { uid } = req.query
  const { orgId } = user

  const userRef = db.collection('users').doc(uid)
  const snap = await userRef.get()
  if (!snap.exists || snap.data().orgId !== orgId) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  if (req.method === 'PATCH') {
    const parsed = patchSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    }

    const patch = { ...parsed.data, updatedAt: FieldValue.serverTimestamp() }
    await userRef.update(patch)

    if (parsed.data.role !== undefined) {
      await auth.setCustomUserClaims(uid, { orgId, role: parsed.data.role })
      await auth.revokeRefreshTokens(uid)
    }

    if (parsed.data.active === false) {
      await auth.updateUser(uid, { disabled: true })
      await auth.revokeRefreshTokens(uid)
    } else if (parsed.data.active === true) {
      await auth.updateUser(uid, { disabled: false })
    }

    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    if (uid === user.uid) {
      return res.status(400).json({ error: 'No podés desactivarte a vos mismo' })
    }
    await userRef.update({ active: false, updatedAt: FieldValue.serverTimestamp() })
    await auth.updateUser(uid, { disabled: true })
    await auth.revokeRefreshTokens(uid)
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  res.status(405).json({ error: 'Method not allowed' })
}
