import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const alertsApi = {
  list: (params = {}) => api.get('/alerts/', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  ingest: (data) => api.post('/alerts/ingest', data),
  acknowledge: (id, data) => api.post(`/alerts/${id}/acknowledge`, data),
  resolve: (id) => api.post(`/alerts/${id}/resolve`),
  bulkAcknowledge: (ids, data) => api.post('/alerts/bulk/acknowledge', ids, { params: data }),
  groups: (params = {}) => api.get('/alerts/groups', { params }),
  suppressionRules: () => api.get('/alerts/suppression/rules'),
  createSuppressionRule: (data) => api.post('/alerts/suppression/rules', data),
  deleteSuppressionRule: (id) => api.delete(`/alerts/suppression/rules/${id}`),
}

export const metricsApi = {
  summary: () => api.get('/metrics/summary'),
  realtime: () => api.get('/metrics/realtime'),
}

export const teamsApi = {
  list: () => api.get('/teams/'),
}

export const createWebSocket = () => {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
  return new WebSocket(`${WS_URL}/ws/alerts`)
}

export default api
