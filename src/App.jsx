import { AuthProvider } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <AppRouter />
      </SyncProvider>
    </AuthProvider>
  )
}
