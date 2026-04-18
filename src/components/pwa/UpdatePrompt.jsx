import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.error('SW register error', err)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-3 top-3 z-40 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-lg sm:left-auto sm:right-4 sm:w-80">
      <svg className="h-5 w-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p className="min-w-0 flex-1 text-xs font-medium text-amber-900">
        Hay una versión nueva disponible.
      </p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
      >
        Actualizar
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-amber-700 hover:text-amber-900"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}
