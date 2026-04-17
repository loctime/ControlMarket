import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const icons = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  sales: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  products: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  history: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  team: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
}

export default function BottomNav() {
  const { role } = useAuth()
  const base = 'flex flex-col items-center gap-1 px-4 py-2 text-xs text-gray-500 transition-colors'
  const active = 'text-primary-600'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white">
      {role === 'admin' && (
        <NavLink to="/dashboard" className={({ isActive }) => `${base} ${isActive ? active : ''} flex-1`}>
          {icons.dashboard}
          <span>Inicio</span>
        </NavLink>
      )}
      <NavLink to="/sales" className={({ isActive }) => `${base} ${isActive ? active : ''} flex-1`}>
        {icons.sales}
        <span>Vender</span>
      </NavLink>
      {role === 'admin' && (
        <NavLink to="/products" className={({ isActive }) => `${base} ${isActive ? active : ''} flex-1`}>
          {icons.products}
          <span>Productos</span>
        </NavLink>
      )}
      <NavLink to="/sales/history" className={({ isActive }) => `${base} ${isActive ? active : ''} flex-1`}>
        {icons.history}
        <span>Historial</span>
      </NavLink>
      {role === 'admin' && (
        <NavLink to="/equipo" className={({ isActive }) => `${base} ${isActive ? active : ''} flex-1`}>
          {icons.team}
          <span>Equipo</span>
        </NavLink>
      )}
    </nav>
  )
}
