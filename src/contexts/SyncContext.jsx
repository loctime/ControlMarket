import { createContext, useContext } from 'react'
import useSync from '../hooks/useSync'

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const sync = useSync()
  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>
}

export function useSyncContext() {
  return useContext(SyncContext)
}
