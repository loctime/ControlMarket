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
const SCAN_INTERVAL_MS = 120 // ~8 fps
const ROI_WIDTH = 0.92 // 92% del ancho del frame
const ROI_HEIGHT = 0.85 // 85% del alto del frame

function buildReader() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS)
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints)
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
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const readerRef = useRef(null)
  const lastCodeRef = useRef({ code: '', at: 0 })
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    if (!active) {
      stopAll()
      return
    }
    let cancelled = false
    setError('')
    setReady(false)

    ;(async () => {
      try {
        const deviceId = await pickBackCameraId()
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play().catch(() => {})
        readerRef.current = buildReader()
        canvasRef.current = document.createElement('canvas')
        setReady(true)
        scheduleTick()
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verificá los permisos.')
      }
    })()

    function scheduleTick() {
      timerRef.current = setTimeout(tick, SCAN_INTERVAL_MS)
    }

    function tick() {
      if (cancelled) return
      const video = videoRef.current
      const reader = readerRef.current
      const canvas = canvasRef.current
      if (!video || !reader || !canvas || !video.videoWidth || !video.videoHeight) {
        scheduleTick()
        return
      }
      const vw = video.videoWidth
      const vh = video.videoHeight
      const cropW = Math.floor(vw * ROI_WIDTH)
      const cropH = Math.floor(vh * ROI_HEIGHT)
      const cropX = Math.floor((vw - cropW) / 2)
      const cropY = Math.floor((vh - cropH) / 2)
      if (canvas.width !== cropW) canvas.width = cropW
      if (canvas.height !== cropH) canvas.height = cropH
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      let result = null
      try {
        result = reader.decodeFromCanvas(canvas)
      } catch {
        // NotFoundException u otro: normal cuando no hay código en el frame
      }

      if (result) {
        const text = result.getText()
        const now = Date.now()
        const last = lastCodeRef.current
        if (!(text === last.code && now - last.at < DEDUPE_MS)) {
          lastCodeRef.current = { code: text, at: now }
          beep()
          if (navigator.vibrate) navigator.vibrate(40)
          setFlash(true)
          setTimeout(() => setFlash(false), 180)
          onDetectedRef.current?.(text)
        }
      }
      scheduleTick()
    }

    function stopAll() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
      readerRef.current = null
      setReady(false)
    }

    return () => {
      cancelled = true
      stopAll()
    }
  }, [active])

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert type="error">{error}</Alert>}
      <div
        className="relative overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: '16 / 9' }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {!ready && !error && active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            Iniciando cámara…
          </div>
        )}
        {ready && (
          <div className="pointer-events-none absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-primary-400/70" />
        )}
        {flash && <div className="pointer-events-none absolute inset-0 bg-emerald-400/30" />}
      </div>
      <p className="text-center text-xs text-gray-500">
        Apuntá el código de barras al centro
      </p>
    </div>
  )
}
