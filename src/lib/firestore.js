import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  increment,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'

function assertOrg(orgId) {
  if (!orgId) throw new Error('Sesión sin organización')
}

// ── Products ─────────────────────────────────────────────────────────────────

export function subscribeProducts(orgId, callback) {
  assertOrg(orgId)
  const q = query(
    collection(db, 'products'),
    where('orgId', '==', orgId),
    where('active', '==', true),
    orderBy('name')
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export async function getProductByBarcode(orgId, barcode) {
  assertOrg(orgId)
  const q = query(
    collection(db, 'products'),
    where('orgId', '==', orgId),
    where('barcode', '==', barcode),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function addProduct(orgId, data) {
  assertOrg(orgId)
  return addDoc(collection(db, 'products'), {
    ...data,
    orgId,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProduct(id, data) {
  return updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() })
}

export async function softDeleteProduct(id) {
  return updateDoc(doc(db, 'products', id), { active: false, updatedAt: serverTimestamp() })
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(orgId) {
  assertOrg(orgId)
  const snap = await getDocs(
    query(
      collection(db, 'categories'),
      where('orgId', '==', orgId),
      where('active', '==', true),
      orderBy('order')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function registerSale({
  orgId,
  items,
  total,
  profit,
  paymentMethod,
  vendedorId,
  vendedorName,
  dateKey,
}) {
  assertOrg(orgId)
  const batch = writeBatch(db)

  const saleRef = doc(collection(db, 'sales'))
  batch.set(saleRef, {
    orgId,
    vendedorId,
    vendedorName,
    total,
    profit,
    paymentMethod,
    status: 'completed',
    items,
    dateKey,
    createdAt: serverTimestamp(),
  })

  for (const item of items) {
    const productRef = doc(db, 'products', item.productId)
    batch.update(productRef, { stock: increment(-item.quantity), updatedAt: serverTimestamp() })
  }

  await batch.commit()
  return saleRef.id
}

export function subscribeSalesHistory({ orgId, vendedorId, isAdmin }, callback) {
  assertOrg(orgId)
  const filters = [
    where('orgId', '==', orgId),
    where('status', '==', 'completed'),
  ]
  if (!isAdmin && vendedorId) {
    filters.push(where('vendedorId', '==', vendedorId))
  }
  const q = query(collection(db, 'sales'), ...filters, orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export async function getDailySales(orgId, dateKey) {
  assertOrg(orgId)
  const q = query(
    collection(db, 'sales'),
    where('orgId', '==', orgId),
    where('dateKey', '==', dateKey),
    where('status', '==', 'completed')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getWeeklySales(orgId, startDateKey) {
  assertOrg(orgId)
  const q = query(
    collection(db, 'sales'),
    where('orgId', '==', orgId),
    where('dateKey', '>=', startDateKey),
    where('status', '==', 'completed'),
    orderBy('dateKey')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() }
}

// updateLastLogin: deshabilitado en el cliente. El doc users es de solo lectura
// bajo las reglas multi-tenant; si se necesita tracking de lastLogin, mover al
// backend o usar un trigger onCreate/onSignIn.
export async function updateLastLogin() {
  return null
}
