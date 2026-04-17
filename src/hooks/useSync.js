import { useState, useEffect } from 'react'
import useOnlineStatus from './useOnlineStatus'
import { syncPendingWrites } from '../utils/syncHelpers'

export default function useSync() {
  const isOnline = useOnlineStatus()
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  useEffect(() => {
    if (!isOnline) return
    setSyncing(true)
    syncPendingWrites().then(() => {
      setSyncing(false)
      setLastSyncedAt(new Date())
    })
  }, [isOnline])

  return { isOnline, syncing, lastSyncedAt }
}
