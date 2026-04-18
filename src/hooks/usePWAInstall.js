import { useEffect, useState } from 'react'

const DISMISS_KEY = 'pwa-install-dismissed-at'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream
}

function wasDismissedRecently() {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
  return at && Date.now() - at < DISMISS_MS
}

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    function onBeforeInstall(e) {
      e.preventDefault()
      if (wasDismissedRecently()) return
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    function onInstalled() {
      setDeferredPrompt(null)
      setCanInstall(false)
      setShowIOSHint(false)
      localStorage.removeItem(DISMISS_KEY)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    if (isIOS() && !wasDismissedRecently()) {
      setShowIOSHint(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    if (choice.outcome !== 'accepted') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
    return choice.outcome === 'accepted'
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setCanInstall(false)
    setShowIOSHint(false)
  }

  return { canInstall, showIOSHint, install, dismiss }
}
