import { waitForPendingWrites } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function syncPendingWrites() {
  try {
    await waitForPendingWrites(db)
    return true
  } catch {
    return false
  }
}
