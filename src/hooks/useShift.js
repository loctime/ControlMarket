import { useEffect, useState } from 'react'
import { subscribeActiveShift } from '../lib/shifts'

export default function useActiveShift(orgId) {
  const [state, setState] = useState({ shift: null, loading: !!orgId })

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeActiveShift(orgId, (data) => {
      setState({ shift: data, loading: false })
    })
    return unsub
  }, [orgId])

  return state
}
