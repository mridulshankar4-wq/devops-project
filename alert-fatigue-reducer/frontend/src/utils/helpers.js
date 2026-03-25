import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

export { clsx }

export const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

export function getSeverityClass(severity) {
  return `badge-${severity}`
}

export function getStatusClass(status) {
  return `status-${status}`
}

export function getSeverityColor(severity) {
  const colors = {
    critical: '#ff4757',
    high: '#ff6b35',
    medium: '#ffa502',
    low: '#2ed573',
    info: '#1e90ff',
  }
  return colors[severity] || '#8899aa'
}

export function getStatusColor(status) {
  const colors = {
    firing: '#ff4757',
    resolved: '#2ed573',
    suppressed: '#8888a0',
    acknowledged: '#1e90ff',
  }
  return colors[status] || '#8899aa'
}

export function timeAgo(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'unknown'
  }
}

export function formatTime(date) {
  try {
    return format(new Date(date), 'MMM d, HH:mm:ss')
  } catch {
    return '-'
  }
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function priorityLabel(score) {
  if (score >= 130) return 'P1'
  if (score >= 80) return 'P2'
  if (score >= 40) return 'P3'
  return 'P4'
}

export function priorityColor(score) {
  if (score >= 130) return '#ff4757'
  if (score >= 80) return '#ff6b35'
  if (score >= 40) return '#ffa502'
  return '#2ed573'
}
