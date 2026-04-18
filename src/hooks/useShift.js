import { useEffect, useState } from 'react'
import { subscribeActiveShift, subscribeShiftsHistory } from '../lib/shifts'

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

export function useShiftsHistory(orgId) {
  const [state, setState] = useState({ shifts: [], loading: !!orgId })

  useEffect(() => {
    if (!orgId) return
    const unsub = subscribeShiftsHistory(orgId, (data) => {
      setState({ shifts: data, loading: false })
    })
    return unsub
  }, [orgId])

  return state
}
