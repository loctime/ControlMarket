import usePWAInstall from '../../hooks/usePWAInstall'

export default function InstallPrompt() {
  const { canInstall, showIOSHint, install, dismiss } = usePWAInstall()

  if (!canInstall && !showIOSHint) return null

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 flex items-start gap-3 rounded-2xl border border-primary-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4 sm:w-80">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600">
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">Instalar ControlMarket</p>
        {canInstall ? (
          <>
            <p className="mt-0.5 text-xs text-gray-600">
              Abrí la app en su propia ventana, más rápido y sin barra del navegador.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={install}
                className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              >
                Instalar
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Después
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-gray-600">
              En iOS: tocá <span aria-label="compartir">⬆️</span> y luego
              <strong> "Agregar a la pantalla de inicio"</strong>.
            </p>
            <button
              onClick={dismiss}
              className="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  )
}
