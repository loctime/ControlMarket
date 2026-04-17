import { Router } from 'express'
import { z } from 'zod'
import { auth, db, FieldValue } from '../firebaseAdmin.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['admin', 'vendedor']).default('vendedor'),
})

const patchSchema = z.object({
  role: z.enum(['admin', 'vendedor']).optional(),
  active: z.boolean().optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
})

router.get('/team', async (req, res) => {
  const snap = await db.collection('users').where('orgId', '==', req.user.orgId).get()
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  res.json({ users })
})

router.post('/team', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
  }
  const { email, password, displayName, role } = parsed.data
  const { orgId } = req.user

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

  res.status(201).json({ uid: userRecord.uid, orgId, email, role })
})

router.patch('/team/:uid', async (req, res) => {
  const parsed = patchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
  }
  const { uid } = req.params
  const { orgId } = req.user

  const userRef = db.collection('users').doc(uid)
  const snap = await userRef.get()
  if (!snap.exists || snap.data().orgId !== orgId) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
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

  res.json({ ok: true })
})

router.delete('/team/:uid', async (req, res) => {
  const { uid } = req.params
  const { orgId } = req.user

  if (uid === req.user.uid) {
    return res.status(400).json({ error: 'No podés desactivarte a vos mismo' })
  }

  const userRef = db.collection('users').doc(uid)
  const snap = await userRef.get()
  if (!snap.exists || snap.data().orgId !== orgId) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  await userRef.update({ active: false, updatedAt: FieldValue.serverTimestamp() })
  await auth.updateUser(uid, { disabled: true })
  await auth.revokeRefreshTokens(uid)
  res.json({ ok: true })
})

export default router
