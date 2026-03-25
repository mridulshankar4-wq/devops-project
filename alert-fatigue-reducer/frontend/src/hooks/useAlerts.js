import { useState, useEffect, useCallback } from 'react'
import { alertsApi, metricsApi, createWebSocket } from '../services/api'
import toast from 'react-hot-toast'

export function useAlerts(params = {}) {
  const [alerts, setAlerts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await alertsApi.list(params)
      setAlerts(data.items || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  return { alerts, total, loading, error, refetch: fetchAlerts }
}

export function useMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await metricsApi.summary()
      setMetrics(data)
    } catch (err) {
      console.error('Metrics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [fetch])

  return { metrics, loading, refetch: fetch }
}

export function useWebSocket(onMessage) {
  const [connected, setConnected] = useState(false)
  const [liveAlerts, setLiveAlerts] = useState([])

  useEffect(() => {
    let ws
    let reconnectTimer
    let mounted = true

    const connect = () => {
      try {
        ws = createWebSocket()

        ws.onopen = () => {
          if (mounted) setConnected(true)
        }

        ws.onmessage = (event) => {
          if (!mounted) return
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'new_alert') {
              setLiveAlerts(prev => [msg.data, ...prev.slice(0, 49)])
              onMessage && onMessage(msg)
            } else if (msg.type === 'alert_resolved' || msg.type === 'alert_acknowledged') {
              onMessage && onMessage(msg)
            }
          } catch (e) {}
        }

        ws.onclose = () => {
          if (mounted) {
            setConnected(false)
            reconnectTimer = setTimeout(connect, 3000)
          }
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch (e) {
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      mounted = false
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [])

  return { connected, liveAlerts }
}

export function useAlertActions(onSuccess) {
  const acknowledge = async (id, by = 'operator') => {
    try {
      await alertsApi.acknowledge(id, { acknowledged_by: by })
      toast.success('Alert acknowledged')
      onSuccess && onSuccess()
    } catch {
      toast.error('Failed to acknowledge alert')
    }
  }

  const resolve = async (id) => {
    try {
      await alertsApi.resolve(id)
      toast.success('Alert resolved')
      onSuccess && onSuccess()
    } catch {
      toast.error('Failed to resolve alert')
    }
  }

  return { acknowledge, resolve }
}
