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

// ── Products ─────────────────────────────────────────────────────────────────

export function subscribeProducts(callback) {
  const q = query(
    collection(db, 'products'),
    where('active', '==', true),
    orderBy('name')
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export async function getProductByBarcode(barcode) {
  const q = query(collection(db, 'products'), where('barcode', '==', barcode), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function addProduct(data) {
  return addDoc(collection(db, 'products'), {
    ...data,
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

export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), where('active', '==', true), orderBy('order')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addCategory(name, order = 999) {
  const ref = await addDoc(collection(db, 'categories'), {
    name,
    order,
    active: true,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, name, order, active: true }
}

// ── Bulk product import ──────────────────────────────────────────────────────

export async function bulkAddProducts(products, { onProgress } = {}) {
  const BATCH_SIZE = 400
  let written = 0
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const product of chunk) {
      const ref = doc(collection(db, 'products'))
      batch.set(ref, {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
    written += chunk.length
    onProgress?.(written, products.length)
  }
  return written
}

export async function getAllProductBarcodes() {
  const snap = await getDocs(query(collection(db, 'products'), where('active', '==', true)))
  return snap.docs
    .map((d) => d.data().barcode)
    .filter((b) => typeof b === 'string' && b.trim().length > 0)
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function registerSale({ items, total, profit, paymentMethod, vendedorId, vendedorName, dateKey }) {
  const batch = writeBatch(db)

  const saleRef = doc(collection(db, 'sales'))
  batch.set(saleRef, {
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

export function subscribeSalesHistory({ vendedorId, startDate, endDate, isAdmin }, callback) {
  let q = query(collection(db, 'sales'), where('status', '==', 'completed'), orderBy('createdAt', 'desc'))

  if (!isAdmin && vendedorId) {
    q = query(
      collection(db, 'sales'),
      where('vendedorId', '==', vendedorId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    )
  }

  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export async function getDailySales(dateKey) {
  const q = query(
    collection(db, 'sales'),
    where('dateKey', '==', dateKey),
    where('status', '==', 'completed')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getWeeklySales(startDateKey) {
  const q = query(
    collection(db, 'sales'),
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

export async function updateLastLogin(uid) {
  return updateDoc(doc(db, 'users', uid), { lastLogin: serverTimestamp() })
}
