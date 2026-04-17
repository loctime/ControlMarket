import { z } from 'zod'
import { auth, db, FieldValue } from './_lib/firebaseAdmin.js'
import { requireAuth, requireAdmin } from './_lib/auth.js'

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['admin', 'vendedor']).default('vendedor'),
})

export default async function handler(req, res) {
  let user
  try {
    user = await requireAuth(req)
    requireAdmin(user)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }

  if (req.method === 'GET') {
    const snap = await db.collection('users').where('orgId', '==', user.orgId).get()
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return res.status(200).json({ users })
  }

  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    }
    const { email, password, displayName, role } = parsed.data
    const { orgId } = user

    let userRecord
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || email,
      })
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Ese email ya está registrado' })
      }
      return res.status(400).json({ error: err.message })
    }

    try {
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        orgId,
        email,
        displayName: displayName || email,
        role,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      })
      await auth.setCustomUserClaims(userRecord.uid, { orgId, role })
    } catch (err) {
      await auth.deleteUser(userRecord.uid).catch(() => {})
      return res.status(500).json({ error: 'Error creando colaborador', detail: err.message })
    }

    return res.status(201).json({ uid: userRecord.uid, orgId, email, role })
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: 'Method not allowed' })
}
