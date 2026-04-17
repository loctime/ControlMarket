import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { useSyncContext } from '../../contexts/SyncContext'

export default function AppShell() {
  const { isOnline } = useSyncContext()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      {!isOnline && (
        <div className="bg-yellow-500 py-1.5 text-center text-xs font-medium text-white">
          Sin conexión — los cambios se guardan y se sincronizarán al reconectarte
        </div>
      )}
      <main className="flex-1 overflow-y-auto pb-20 pt-4">
        <div className="mx-auto max-w-2xl px-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
