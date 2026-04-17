import { z } from 'zod'
import { auth, db, FieldValue } from './_lib/firebaseAdmin.js'

const schema = z.object({
  nombreEmpresa: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
  }
  const { nombreEmpresa, email, password, displayName } = parsed.data

  let userRecord
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || nombreEmpresa,
    })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Ese email ya está registrado' })
    }
    return res.status(400).json({ error: err.message })
  }

  const orgRef = db.collection('organizations').doc()
  const orgId = orgRef.id

  try {
    await db.runTransaction(async (tx) => {
      tx.set(orgRef, {
        name: nombreEmpresa,
        ownerUid: userRecord.uid,
        plan: 'free',
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      })
      tx.set(db.collection('users').doc(userRecord.uid), {
        uid: userRecord.uid,
        orgId,
        email,
        displayName: displayName || nombreEmpresa,
        role: 'admin',
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    await auth.setCustomUserClaims(userRecord.uid, { orgId, role: 'admin' })
  } catch (err) {
    await auth.deleteUser(userRecord.uid).catch(() => {})
    await orgRef.delete().catch(() => {})
    return res.status(500).json({ error: 'Error creando la organización', detail: err.message })
  }

  res.status(201).json({ uid: userRecord.uid, orgId })
}
