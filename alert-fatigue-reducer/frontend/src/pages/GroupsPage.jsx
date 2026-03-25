import { useState, useEffect } from 'react'
import { alertsApi } from '../services/api'
import { getSeverityColor, timeAgo, getSeverityClass, capitalize } from '../utils/helpers'
import { Layers, ChevronDown, ChevronRight, Clock, Activity } from 'lucide-react'

export default function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await alertsApi.groups({ status: 'active' })
        setGroups(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
    const interval = setInterval(fetch, 8000)
    return () => clearInterval(interval)
  }, [])

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-xl text-white">Alert Groups</h1>
        <p className="text-sm text-slate-500 mt-0.5">Correlated alert clusters · {groups.length} active groups</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-xl animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Layers size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No active alert groups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="glass-card-hover overflow-hidden">
              <button onClick={() => toggle(group.id)}
                className="w-full flex items-center gap-4 p-4 text-left">
                <div className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ background: getSeverityColor(group.severity) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getSeverityClass(group.severity)}`}>
                      {group.severity.toUpperCase()}
                    </span>
                    {group.service && (
                      <span className="text-xs font-mono text-slate-500 px-1.5 py-0.5 rounded bg-dark-700">{group.service}</span>
                    )}
                    {group.environment && (
                      <span className="text-xs font-mono text-slate-600">{group.environment}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate">{group.name}</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-lg font-display font-bold" style={{ color: getSeverityColor(group.severity) }}>
                      {group.alert_count}
                    </p>
                    <p className="text-xs text-slate-600">alerts</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-slate-400">{timeAgo(group.last_seen)}</p>
                    <p className="text-xs text-slate-600">last seen</p>
                  </div>
                  <div className="w-5 flex items-center justify-center">
                    {expanded.has(group.id)
                      ? <ChevronDown size={16} className="text-slate-400" />
                      : <ChevronRight size={16} className="text-slate-500" />}
                  </div>
                </div>
              </button>

              {expanded.has(group.id) && group.alerts?.length > 0 && (
                <div className="border-t border-white/5 px-4 py-3 space-y-2">
                  <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">Recent Alerts</p>
                  {group.alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-2.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: getSeverityColor(alert.severity) }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">{alert.title}</p>
                        <p className="text-xs font-mono text-slate-600 mt-0.5">
                          {alert.source} · {timeAgo(alert.fired_at)} · {capitalize(alert.status)}
                        </p>
                      </div>
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                  {group.alerts.length > 5 && (
                    <p className="text-xs text-slate-600 font-mono text-center py-1">
                      + {group.alerts.length - 5} more alerts
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
