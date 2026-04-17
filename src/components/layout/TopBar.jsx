import { useState, useEffect } from 'react'
import useAuth from '../../hooks/useAuth'
import { useSyncContext } from '../../contexts/SyncContext'
import Button from '../ui/Button'

export default function TopBar() {
  const { currentUser, role, logout } = useAuth()
  const { isOnline, syncing } = useSyncContext()
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleInstall() {
    installPrompt?.prompt()
    setInstallPrompt(null)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <span className="font-bold text-primary-800">ControlMarket</span>
        {!isOnline && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            Sin conexión
          </span>
        )}
        {isOnline && syncing && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            Sincronizando…
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {installPrompt && (
          <Button variant="ghost" size="sm" onClick={handleInstall}>Instalar app</Button>
        )}
        <span className="hidden text-xs text-gray-500 sm:block">
          {currentUser?.email} · <span className="capitalize">{role}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
      </div>
    </header>
  )
}
