import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'

export const PAYMENT_METHODS = ['efectivo', 'debito', 'credito', 'qr', 'transferencia', 'cuenta']

export const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  qr: 'QR / MP',
  transferencia: 'Transferencia',
  cuenta: 'Cta. corriente',
}

function emptyTotals() {
  return PAYMENT_METHODS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {})
}

export function subscribeActiveShift(orgId, callback) {
  if (!orgId) return () => {}
  const q = query(
    collection(db, 'shifts'),
    where('orgId', '==', orgId),
    where('status', '==', 'open'),
    limit(1)
  )
  return onSnapshot(q, (snap) => {
    if (snap.empty) return callback(null)
    const d = snap.docs[0]
    callback({ id: d.id, ...d.data() })
  })
}

export async function openShift({ orgId, openingCash, user, notes }) {
  if (!orgId) throw new Error('Sesión sin organización')
  const existing = await getDocs(
    query(
      collection(db, 'shifts'),
      where('orgId', '==', orgId),
      where('status', '==', 'open'),
      limit(1)
    )
  )
  if (!existing.empty) {
    throw new Error('Ya hay una caja abierta')
  }
  const batch = writeBatch(db)
  const ref = doc(collection(db, 'shifts'))
  batch.set(ref, {
    orgId,
    status: 'open',
    openingCash: Number(openingCash) || 0,
    openedBy: user.uid,
    openedByName: user.displayName || user.email,
    openedAt: serverTimestamp(),
    totals: emptyTotals(),
    salesCount: 0,
    cashIn: 0,
    cashOut: 0,
    movements: [],
    notes: notes || '',
  })
  await batch.commit()
  return ref.id
}

export async function closeShift({ shiftId, closingCash, leftInDrawer, user, notes }) {
  if (!shiftId) throw new Error('Sin turno activo')
  const ref = doc(db, 'shifts', shiftId)
  const batch = writeBatch(db)
  batch.update(ref, {
    status: 'closed',
    closingCash: Number(closingCash) || 0,
    leftInDrawer: Number(leftInDrawer) || 0,
    closedBy: user.uid,
    closedByName: user.displayName || user.email,
    closedAt: serverTimestamp(),
    closingNotes: notes || '',
  })
  await batch.commit()
}

export async function getLastClosedShift(orgId) {
  if (!orgId) return null
  const q = query(
    collection(db, 'shifts'),
    where('orgId', '==', orgId),
    where('status', '==', 'closed'),
    orderBy('closedAt', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export function subscribeShiftsHistory(orgId, callback) {
  if (!orgId) return () => {}
  const q = query(
    collection(db, 'shifts'),
    where('orgId', '==', orgId),
    where('status', '==', 'closed'),
    orderBy('closedAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export async function addCashMovement({ shiftId, type, amount, reason, user }) {
  if (!shiftId) throw new Error('Sin turno activo')
  if (!['in', 'out'].includes(type)) throw new Error('Tipo de movimiento inválido')
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) throw new Error('Monto inválido')

  const ref = doc(db, 'shifts', shiftId)
  const movement = {
    id: crypto.randomUUID(),
    type,
    amount: value,
    reason: reason || '',
    by: user.uid,
    byName: user.displayName || user.email,
    at: new Date().toISOString(),
  }
  const batch = writeBatch(db)
  batch.update(ref, {
    movements: arrayUnion(movement),
    [type === 'in' ? 'cashIn' : 'cashOut']: increment(value),
  })
  await batch.commit()
  return movement
}

export function computeExpectedCash(shift) {
  if (!shift) return 0
  const cashSales = shift.totals?.efectivo ?? 0
  return (shift.openingCash ?? 0) + cashSales + (shift.cashIn ?? 0) - (shift.cashOut ?? 0)
}

export function computeShiftTotal(shift) {
  if (!shift?.totals) return 0
  return PAYMENT_METHODS.reduce((sum, m) => sum + (shift.totals[m] ?? 0), 0)
}
