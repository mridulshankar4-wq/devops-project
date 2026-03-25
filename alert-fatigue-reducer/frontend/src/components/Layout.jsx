import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Bell, Layers, ShieldOff,
  Activity, Zap, ChevronRight, Wifi, WifiOff
} from 'lucide-react'
import { useWebSocket, useMetrics } from '../hooks/useAlerts'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/alerts', icon: Bell, label: 'Alert Feed' },
  { path: '/groups', icon: Layers, label: 'Alert Groups' },
  { path: '/suppression', icon: ShieldOff, label: 'Suppression' },
  { path: '/monitoring', icon: Activity, label: 'Monitoring' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { metrics } = useMetrics()
  const { connected, liveAlerts } = useWebSocket((msg) => {
    if (msg.type === 'new_alert' && msg.data.severity === 'critical') {
      toast.error(`🚨 Critical: ${msg.data.title}`, { duration: 5000 })
    }
  })

  const firingCritical = metrics?.critical_count || 0

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950 grid-pattern">
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0`}
        style={{ background: 'rgba(6,13,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d4ff22, #00d4ff44)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <Zap size={16} className="text-brand" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-display font-bold text-sm text-white leading-tight">AlertPulse</div>
              <div className="text-xs text-slate-500 font-mono">v1.0.0</div>
            </div>
          )}
        </div>

        {/* System Status */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 p-3 rounded-lg" style={{
            background: firingCritical > 0 ? 'rgba(255,71,87,0.08)' : 'rgba(46,213,115,0.08)',
            border: `1px solid ${firingCritical > 0 ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)'}`,
          }}>
            <div className="flex items-center gap-2">
              <span className="pulse-dot" style={{ background: firingCritical > 0 ? '#ff4757' : '#2ed573' }} />
              <span className="text-xs font-mono font-medium" style={{ color: firingCritical > 0 ? '#ff4757' : '#2ed573' }}>
                {firingCritical > 0 ? `${firingCritical} CRITICAL` : 'ALL SYSTEMS OK'}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Connection status */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            {connected
              ? <Wifi size={14} className="text-green-400" />
              : <WifiOff size={14} className="text-red-400" />}
            {sidebarOpen && (
              <span className="text-xs font-mono" style={{ color: connected ? '#2ed573' : '#ff4757' }}>
                {connected ? 'Live Stream' : 'Reconnecting'}
              </span>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-white/5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronRight size={16} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0"
          style={{ background: 'rgba(6,13,20,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {metrics && (
              <div className="flex items-center gap-3 ml-4">
                <StatBadge label="Total" value={metrics.total_alerts} color="#8899aa" />
                <StatBadge label="Firing" value={metrics.firing_alerts} color="#ff4757" />
                <StatBadge label="Noise ↓" value={`${metrics.noise_reduction_pct}%`} color="#2ed573" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {liveAlerts.length > 0 && (
              <div className="text-xs font-mono px-2 py-1 rounded" style={{
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff',
              }}>
                {liveAlerts.length} live
              </div>
            )}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #00d4ff33, #00d4ff55)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
              OP
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}
