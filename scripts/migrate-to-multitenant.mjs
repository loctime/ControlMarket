#!/usr/bin/env node
/**
 * Migración one-shot: agrupa todos los datos existentes en una única
 * organización "legacy" y setea custom claims (orgId + role) a todos
 * los usuarios.
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{...}' \
 *   LEGACY_OWNER_UID='uid-del-admin-original' \
 *   LEGACY_ORG_NAME='Mi Negocio' \
 *   node scripts/migrate-to-multitenant.mjs
 *
 * Idempotente: si un doc ya tiene orgId, lo saltea.
 */
import admin from 'firebase-admin'

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
const ownerUid = process.env.LEGACY_OWNER_UID
const orgName = process.env.LEGACY_ORG_NAME || 'Organización legacy'

if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_JSON')
if (!ownerUid) throw new Error('Falta LEGACY_OWNER_UID')

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) })
const db = admin.firestore()
const auth = admin.auth()

async function run() {
  console.log('→ Creando organización legacy...')
  const orgRef = db.collection('organizations').doc()
  const orgId = orgRef.id
  await orgRef.set({
    name: orgName,
    ownerUid,
    plan: 'free',
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log(`  orgId = ${orgId}`)

  const collections = ['users', 'products', 'categories', 'sales']
  for (const coll of collections) {
    console.log(`→ Migrando colección "${coll}"...`)
    const snap = await db.collection(coll).get()
    let updated = 0
    let skipped = 0
    const batch = db.batch()
    let ops = 0
    for (const doc of snap.docs) {
      if (doc.data().orgId) {
        skipped++
        continue
      }
      batch.update(doc.ref, { orgId })
      updated++
      ops++
      if (ops >= 400) {
        await batch.commit()
        ops = 0
      }
    }
    if (ops > 0) await batch.commit()
    console.log(`  ${coll}: actualizados ${updated}, saltados ${skipped}`)
  }

  console.log('→ Seteando custom claims a todos los users...')
  const usersSnap = await db.collection('users').get()
  let claimed = 0
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    const role = doc.id === ownerUid ? 'admin' : data.role || 'vendedor'
    await auth.setCustomUserClaims(doc.id, { orgId, role })
    if (doc.id === ownerUid && data.role !== 'admin') {
      await doc.ref.update({ role: 'admin' })
    }
    claimed++
  }
  console.log(`  claims seteados a ${claimed} users`)

  console.log(`\nMigración completa. orgId = ${orgId}`)
  console.log('Nota: los usuarios deben volver a loguearse para que los claims surtan efecto.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
