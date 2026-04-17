import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import Alert from '../ui/Alert'

const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
]

const DEDUPE_MS = 1500

function buildReader() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS)
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 80,
    delayBetweenScanSuccess: 400,
  })
}

async function pickBackCameraId() {
  try {
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (!devices.length) return undefined
    const back = devices.find((d) => /back|rear|environment|trás|traser/i.test(d.label))
    return (back ?? devices[devices.length - 1]).deviceId
  } catch {
    return undefined
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
    setTimeout(() => ctx.close().catch(() => {}), 300)
  } catch {
    // ignored
  }
}

export default function BarcodeScanner({ active, onDetected }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const lastCodeRef = useRef({ code: '', at: 0 })
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    if (!active) {
      controlsRef.current?.stop()
      controlsRef.current = null
      setScanning(false)
      return
    }

    let cancelled = false
    setError('')
    const reader = buildReader()

    ;(async () => {
      const deviceId = await pickBackCameraId()
      if (cancelled) return
      try {
        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (!result) return
            const text = result.getText()
            const now = Date.now()
            const last = lastCodeRef.current
            if (text === last.code && now - last.at < DEDUPE_MS) return
            lastCodeRef.current = { code: text, at: now }
            beep()
            if (navigator.vibrate) navigator.vibrate(40)
            setFlash(true)
            setTimeout(() => setFlash(false), 180)
            onDetectedRef.current?.(text)
          }
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setScanning(true)
      } catch {
        if (!cancelled) {
          setError('No se pudo acceder a la cámara. Verificá los permisos.')
        }
      }
    })()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [active])

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert type="error">{error}</Alert>}
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="w-full" playsInline muted autoPlay />
        {scanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-64 rounded-lg border-2 border-primary-400 opacity-70" />
          </div>
        )}
        {!scanning && !error && active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            Iniciando cámara…
          </div>
        )}
        {flash && <div className="pointer-events-none absolute inset-0 bg-emerald-400/30" />}
      </div>
    </div>
  )
}
