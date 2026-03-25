import { useState, useEffect } from 'react'
import { useAlerts, useAlertActions } from '../hooks/useAlerts'
import { getSeverityClass, getStatusClass, timeAgo, truncate, priorityLabel, priorityColor, capitalize } from '../utils/helpers'
import { Search, Filter, CheckCheck, Check, X, ChevronDown, AlertCircle } from 'lucide-react'

const SEVERITIES = ['', 'critical', 'high', 'medium', 'low', 'info']
const STATUSES = ['', 'firing', 'acknowledged', 'suppressed', 'resolved']

export default function AlertsPage() {
  const [filters, setFilters] = useState({ severity: '', status: '', search: '', is_noise: undefined, page: 1, size: 25 })
  const [selected, setSelected] = useState(new Set())

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const { alerts, total, loading, refetch } = useAlerts(queryParams)
  const { acknowledge, resolve } = useAlertActions(refetch)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === alerts.length) setSelected(new Set())
    else setSelected(new Set(alerts.map(a => a.id)))
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Alert Feed</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} alerts · sorted by priority</p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{selected.size} selected</span>
            <button onClick={() => { selected.forEach(id => acknowledge(id, 'operator')); setSelected(new Set()) }}
              className="btn-primary flex items-center gap-1.5">
              <CheckCheck size={13} /> Ack All
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/40"
            />
          </div>
          <FilterSelect label="Severity" value={filters.severity} options={SEVERITIES}
            onChange={v => setFilters(f => ({ ...f, severity: v, page: 1 }))} />
          <FilterSelect label="Status" value={filters.status} options={STATUSES}
            onChange={v => setFilters(f => ({ ...f, status: v, page: 1 }))} />
          <button
            onClick={() => setFilters(f => ({ ...f, is_noise: f.is_noise === undefined ? false : undefined, page: 1 }))}
            className={`btn-ghost text-xs flex items-center gap-1.5 ${filters.is_noise === false ? 'border-brand/30 text-brand' : ''}`}>
            <Filter size={12} />
            {filters.is_noise === false ? 'Signal Only' : 'All Alerts'}
          </button>
          <button onClick={() => setFilters({ severity: '', status: '', search: '', is_noise: undefined, page: 1, size: 25 })}
            className="btn-ghost text-xs">
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 w-10">
                  <input type="checkbox" checked={selected.size === alerts.length && alerts.length > 0}
                    onChange={selectAll}
                    className="w-3.5 h-3.5 rounded border-dark-500 accent-brand" />
                </th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Alert</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Service</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Source</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Env</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">When</th>
                <th className="p-4 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/3">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-dark-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center">
                  <AlertCircle size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No alerts found</p>
                </td></tr>
              ) : alerts.map(alert => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  selected={selected.has(alert.id)}
                  onSelect={() => toggleSelect(alert.id)}
                  onAck={() => acknowledge(alert.id, 'operator')}
                  onResolve={() => resolve(alert.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > filters.size && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-slate-500 font-mono">
              {(filters.page - 1) * filters.size + 1}–{Math.min(filters.page * filters.size, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-ghost text-xs disabled:opacity-30">← Prev</button>
              <button disabled={filters.page * filters.size >= total}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-ghost text-xs disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AlertRow({ alert, selected, onSelect, onAck, onResolve }) {
  const pLabel = priorityLabel(alert.priority_score)
  const pColor = priorityColor(alert.priority_score)

  return (
    <tr className={`border-b border-white/3 transition-colors hover:bg-white/[0.02] ${alert.is_noise ? 'opacity-50' : ''} ${selected ? 'bg-brand/5' : ''}`}>
      <td className="p-4">
        <input type="checkbox" checked={selected} onChange={onSelect}
          className="w-3.5 h-3.5 rounded border-dark-500 accent-brand" />
      </td>
      <td className="p-4">
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
          style={{ background: `${pColor}18`, color: pColor, border: `1px solid ${pColor}30` }}>
          {pLabel}
        </span>
      </td>
      <td className="p-4 max-w-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getSeverityClass(alert.severity)}`}>
              {alert.severity.toUpperCase()}
            </span>
            {alert.is_noise && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(136,136,160,0.1)', color: '#8888a0', border: '1px solid rgba(136,136,160,0.2)' }}>
                NOISE
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 mt-1 leading-snug">{truncate(alert.title, 60)}</p>
          {alert.noise_reason && <p className="text-xs text-slate-600 mt-0.5">{alert.noise_reason}</p>}
        </div>
      </td>
      <td className="p-4">
        <span className="text-xs font-mono text-slate-400">{alert.service || '—'}</span>
      </td>
      <td className="p-4">
        <span className="text-xs font-mono text-slate-500">{alert.source}</span>
      </td>
      <td className="p-4">
        <EnvBadge env={alert.environment} />
      </td>
      <td className="p-4">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${getStatusClass(alert.status)}`}>
          {capitalize(alert.status)}
        </span>
      </td>
      <td className="p-4">
        <span className="text-xs font-mono text-slate-500">{timeAgo(alert.fired_at)}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {alert.status === 'firing' && (
            <>
              <button onClick={onAck} title="Acknowledge"
                className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-blue-500/20 text-slate-500 hover:text-blue-400">
                <Check size={12} />
              </button>
              <button onClick={onResolve} title="Resolve"
                className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-green-500/20 text-slate-500 hover:text-green-400">
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function EnvBadge({ env }) {
  const colors = { production: '#ff6b35', staging: '#ffa502', development: '#2ed573' }
  const color = colors[env] || '#8899aa'
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {env || 'prod'}
    </span>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 text-xs bg-dark-700 border border-white/8 rounded-lg text-slate-300 focus:outline-none focus:border-brand/40 cursor-pointer font-mono">
        {options.map(o => (
          <option key={o} value={o}>{o === '' ? `All ${label}s` : capitalize(o)}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  )
}
