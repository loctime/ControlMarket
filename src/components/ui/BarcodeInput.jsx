import { useState } from 'react'
import BarcodeScanner from '../sales/BarcodeScanner'

export default function BarcodeInput({ label, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)

  function handleDetected(code) {
    onChange(code)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-stretch gap-2">
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Escanear con la cámara"
          title="Escanear con la cámara"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8h10M7 12h10M7 16h6" />
          </svg>
          Escanear
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Escanear código</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <BarcodeScanner active={open} onDetected={handleDetected} />
            <p className="mt-2 text-xs text-gray-500">
              Apuntá la cámara al código. Se cierra al detectarlo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
