import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import AppRouter from './router/AppRouter'
import InstallPrompt from './components/pwa/InstallPrompt'

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <AppRouter />
        <InstallPrompt />
      </SyncProvider>
    </AuthProvider>
  )
}
