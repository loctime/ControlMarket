import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import AppShell from '../components/layout/AppShell'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ProductsPage from '../pages/ProductsPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import SalesPage from '../pages/SalesPage'
import SaleHistoryPage from '../pages/SaleHistoryPage'
import TeamPage from '../pages/TeamPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/history" element={<SaleHistoryPage />} />
          <Route
            path="/equipo"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TeamPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
