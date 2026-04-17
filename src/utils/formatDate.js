import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function toDateKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}

export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatRelative(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

export function getLast7DaysKeys() {
  const keys = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(format(d, 'yyyy-MM-dd'))
  }
  return keys
}
