import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

export default function BarcodeScanner({ onDetected, active }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!active) {
      controlsRef.current?.stop()
      setScanning(false)
      return
    }

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls
        if (result) {
          onDetected(result.getText())
        }
        if (err && err.name !== 'NotFoundException') {
          setError('Error al acceder a la cámara')
        }
      })
      .then(() => setScanning(true))
      .catch(() => setError('No se pudo acceder a la cámara. Verificá los permisos.'))

    return () => {
      controlsRef.current?.stop()
    }
  }, [active, onDetected])

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert type="error">{error}</Alert>}
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="w-full" playsInline muted />
        {scanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-64 rounded-lg border-2 border-primary-400 opacity-70" />
          </div>
        )}
        {!scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            Iniciando cámara…
          </div>
        )}
      </div>
    </div>
  )
}
