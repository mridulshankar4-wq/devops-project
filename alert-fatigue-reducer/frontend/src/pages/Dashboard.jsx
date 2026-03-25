import { useMetrics, useWebSocket } from '../hooks/useAlerts'
import { getSeverityColor, timeAgo, priorityLabel, priorityColor } from '../utils/helpers'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'
import { AlertTriangle, TrendingDown, Layers, Zap, RefreshCw, Activity, Shield } from 'lucide-react'
import { useState } from 'react'

const PIE_COLORS = ['#ff4757', '#ff6b35', '#ffa502', '#2ed573', '#1e90ff']

export default function Dashboard() {
  const { metrics, loading, refetch } = useMetrics()
  const { connected, liveAlerts } = useWebSocket()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setTimeout(() => setRefreshing(false), 600)
  }

  if (loading) return <DashboardSkeleton />

  const severityData = metrics ? [
    { name: 'Critical', value: metrics.critical_count, color: '#ff4757' },
    { name: 'High', value: metrics.high_count, color: '#ff6b35' },
    { name: 'Medium', value: metrics.medium_count, color: '#ffa502' },
    { name: 'Low', value: metrics.low_count, color: '#2ed573' },
    { name: 'Info', value: metrics.info_count, color: '#1e90ff' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time alert intelligence & noise reduction</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
            style={{ background: connected ? 'rgba(46,213,115,0.08)' : 'rgba(255,71,87,0.08)', border: `1px solid ${connected ? 'rgba(46,213,115,0.2)' : 'rgba(255,71,87,0.2)'}`, color: connected ? '#2ed573' : '#ff4757' }}>
            <span className="pulse-dot" style={{ background: connected ? '#2ed573' : '#ff4757' }} />
            {connected ? 'Live' : 'Offline'}
          </div>
          <button onClick={handleRefresh} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Firing Alerts"
          value={metrics?.firing_alerts ?? 0}
          sub="active incidents"
          icon={AlertTriangle}
          color="#ff4757"
          type="critical"
        />
        <KpiCard
          title="Noise Reduced"
          value={`${metrics?.noise_reduction_pct ?? 0}%`}
          sub="suppressed & deduped"
          icon={TrendingDown}
          color="#2ed573"
          type="success"
        />
        <KpiCard
          title="Alert Groups"
          value={metrics?.active_groups ?? 0}
          sub="correlated clusters"
          icon={Layers}
          color="#00d4ff"
          type="info"
        />
        <KpiCard
          title="Alerts / Hour"
          value={Math.round(metrics?.alerts_per_hour ?? 0)}
          sub="ingestion rate"
          icon={Zap}
          color="#ffa502"
          type="medium"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm text-white">Alert Volume — 24h</h2>
            <span className="text-xs font-mono text-slate-500">hourly buckets</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics?.timeline || []}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fill: '#445566', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#445566', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }} />
              <Area type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} fill="url(#alertGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Pie */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-sm text-white mb-4">Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                paddingAngle={3} dataKey="value">
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {severityData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-mono font-semibold" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top Services */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-sm text-white mb-4">Top Noisy Services</h2>
          <div className="space-y-3">
            {(metrics?.top_services || []).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 truncate">{s.service}</span>
                    <span className="text-xs font-mono text-slate-400">{s.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-dark-600">
                    <div className="h-1 rounded-full" style={{
                      width: `${Math.min(100, (s.count / (metrics?.top_services[0]?.count || 1)) * 100)}%`,
                      background: `hsl(${200 - i * 25}, 80%, 60%)`,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-sm text-white mb-4">Alert Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Firing', value: metrics?.firing_alerts || 0, color: '#ff4757' },
              { label: 'Acknowledged', value: metrics?.acknowledged_alerts || 0, color: '#1e90ff' },
              { label: 'Suppressed', value: metrics?.suppressed_alerts || 0, color: '#8888a0' },
              { label: 'Resolved', value: metrics?.resolved_alerts || 0, color: '#2ed573' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <span className="font-mono font-bold text-sm" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm text-white">Live Stream</h2>
            <span className="pulse-dot" style={{ background: connected ? '#2ed573' : '#ff4757' }} />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {liveAlerts.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4 font-mono">Waiting for events...</p>
            ) : liveAlerts.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg animate-slide-up"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: getSeverityColor(a.severity) }} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 truncate">{a.title}</p>
                  <p className="text-xs font-mono text-slate-600">{a.service} · {timeAgo(a.fired_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, sub, icon: Icon, color, type }) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
          <p className="font-display font-bold text-3xl mt-1" style={{ color }}>{value}</p>
          <p className="text-xs text-slate-600 mt-1">{sub}</p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-dark-700 rounded w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-dark-800 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-64 bg-dark-800 rounded-xl" />
        <div className="h-64 bg-dark-800 rounded-xl" />
      </div>
    </div>
  )
}
