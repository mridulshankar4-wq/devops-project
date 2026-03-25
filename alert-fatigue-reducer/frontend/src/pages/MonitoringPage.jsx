import { useState, useEffect } from 'react'
import { metricsApi } from '../services/api'
import { Activity, ExternalLink, Server, Database, Zap, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const GRAFANA_URL = 'http://localhost:3001'
const PROMETHEUS_URL = 'http://localhost:9090'

export default function MonitoringPage() {
  const [realtime, setRealtime] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await metricsApi.realtime()
        setRealtime(data)
        setHistory(prev => {
          const entry = {
            time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            critical: data.firing_critical || 0,
            ...Object.entries(data.recent_5min || {}).reduce((a, [k, v]) => ({ ...a, [k]: v }), {}),
          }
          return [...prev.slice(-29), entry]
        })
      } catch (e) {}
    }
    fetch()
    const i = setInterval(fetch, 3000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-xl text-white">Monitoring & Observability</h1>
        <p className="text-sm text-slate-500 mt-0.5">Prometheus metrics · Grafana dashboards · Real-time telemetry</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <a href={GRAFANA_URL} target="_blank" rel="noreferrer"
          className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <Activity size={22} style={{ color: '#ff6b35' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-white">Grafana Dashboard</span>
              <ExternalLink size={12} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{GRAFANA_URL}</p>
            <p className="text-xs text-slate-600 mt-1">Alert volume · Noise reduction · Service health</p>
          </div>
        </a>

        <a href={PROMETHEUS_URL} target="_blank" rel="noreferrer"
          className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(230,76,48,0.15)', border: '1px solid rgba(230,76,48,0.3)' }}>
            <Database size={22} style={{ color: '#e64c30' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-white">Prometheus</span>
              <ExternalLink size={12} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{PROMETHEUS_URL}</p>
            <p className="text-xs text-slate-600 mt-1">Raw metrics · PromQL · Targets</p>
          </div>
        </a>
      </div>

      {/* System Health */}
      {realtime && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">System Health</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: realtime.system_health === 'healthy' ? 'rgba(46,213,115,0.15)' : realtime.system_health === 'warning' ? 'rgba(255,165,2,0.15)' : 'rgba(255,71,87,0.15)',
                  border: `1px solid ${realtime.system_health === 'healthy' ? 'rgba(46,213,115,0.3)' : realtime.system_health === 'warning' ? 'rgba(255,165,2,0.3)' : 'rgba(255,71,87,0.3)'}`,
                }}>
                <Server size={16} style={{ color: realtime.system_health === 'healthy' ? '#2ed573' : realtime.system_health === 'warning' ? '#ffa502' : '#ff4757' }} />
              </div>
              <div>
                <p className="font-display font-bold text-lg capitalize" style={{ color: realtime.system_health === 'healthy' ? '#2ed573' : realtime.system_health === 'warning' ? '#ffa502' : '#ff4757' }}>
                  {realtime.system_health}
                </p>
                <p className="text-xs text-slate-500">{realtime.firing_critical} critical firing</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">Last 5 Minutes</p>
            <div className="space-y-1.5">
              {Object.entries(realtime.recent_5min || {}).map(([sev, count]) => (
                <div key={sev} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 capitalize">{sev}</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">API Endpoint</p>
            <a href="http://localhost:8000/metrics" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-brand hover:underline">
              <Zap size={12} />
              /metrics (Prometheus)
              <ExternalLink size={10} />
            </a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-brand mt-2">
              <Activity size={12} />
              /docs (Swagger UI)
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Live metrics chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-sm text-white">Live Critical Alerts — Real-time</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="pulse-dot" style={{ background: '#ff4757' }} />
            3s refresh
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <XAxis dataKey="time" tick={{ fill: '#445566', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#445566', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 8, fontSize: 11 }} />
            <Line type="monotone" dataKey="critical" stroke="#ff4757" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Prometheus metrics */}
      <div className="glass-card p-5">
        <h2 className="font-display font-semibold text-sm text-white mb-4">Key Prometheus Metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { metric: 'afr_alerts_received_total', desc: 'Total alerts ingested by the system' },
            { metric: 'afr_alerts_suppressed_total', desc: 'Alerts suppressed by rules or dedup' },
            { metric: 'afr_noise_reduction_percentage', desc: 'Current noise reduction percentage' },
            { metric: 'afr_active_alerts{severity="critical"}', desc: 'Currently firing critical alerts' },
            { metric: 'afr_alerts_per_minute', desc: 'Alert ingestion rate per minute' },
            { metric: 'afr_alert_processing_seconds', desc: 'Alert processing latency histogram' },
          ].map((m, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-mono text-brand mb-1">{m.metric}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
