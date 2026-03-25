import { useState, useEffect } from 'react'
import { alertsApi } from '../services/api'
import { formatTime, timeAgo } from '../utils/helpers'
import { ShieldOff, Plus, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESETS = [
  { name: 'Maintenance Window', match_service: '', match_severity: '', duration_seconds: 7200, reason: 'Scheduled maintenance' },
  { name: 'Suppress Low/Info', match_severity: 'low', duration_seconds: 3600, reason: 'Noise reduction' },
  { name: 'Staging Alerts', match_service: '', match_severity: '', duration_seconds: 86400, reason: 'Staging environment' },
]

export default function SuppressionPage() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', match_service: '', match_severity: '',
    match_source: '', duration_seconds: 3600, reason: '', created_by: 'operator',
  })

  const fetchRules = async () => {
    try {
      const data = await alertsApi.suppressionRules()
      setRules(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRules() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Rule name is required')
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      await alertsApi.createSuppressionRule(payload)
      toast.success('Suppression rule created')
      setShowForm(false)
      setForm({ name: '', description: '', match_service: '', match_severity: '', match_source: '', duration_seconds: 3600, reason: '', created_by: 'operator' })
      fetchRules()
    } catch { toast.error('Failed to create rule') }
  }

  const handleDelete = async (id) => {
    try {
      await alertsApi.deleteSuppressionRule(id)
      toast.success('Rule deleted')
      fetchRules()
    } catch { toast.error('Failed to delete rule') }
  }

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, ...preset }))
    setShowForm(true)
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Suppression Rules</h1>
          <p className="text-sm text-slate-500 mt-0.5">Silence noisy alerts during maintenance or incidents</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> New Rule
        </button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {PRESETS.map((preset, i) => (
          <button key={i} onClick={() => applyPreset(preset)}
            className="glass-card-hover p-4 text-left transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-brand" />
              <span className="text-sm font-medium text-slate-200">{preset.name}</span>
            </div>
            <p className="text-xs text-slate-500">{preset.reason}</p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              {Math.round(preset.duration_seconds / 3600)}h duration
            </p>
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-5 border border-brand/20 animate-slide-up">
          <h3 className="font-semibold text-white mb-4">Create Suppression Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Rule Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Maintenance Window"
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Reason</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Why are you suppressing?"
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Match Service</label>
              <input value={form.match_service} onChange={e => setForm(f => ({ ...f, match_service: e.target.value }))}
                placeholder="e.g. payment-service (blank = all)"
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Match Severity</label>
              <select value={form.match_severity} onChange={e => setForm(f => ({ ...f, match_severity: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 focus:outline-none focus:border-brand/40">
                <option value="">All severities</option>
                {['critical', 'high', 'medium', 'low', 'info'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Duration (seconds)</label>
              <input type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 focus:outline-none focus:border-brand/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Created By</label>
              <input value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-dark-700 border border-white/8 rounded-lg text-slate-200 focus:outline-none focus:border-brand/40" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleCreate} className="btn-primary">Create Rule</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Active Rules</span>
          <span className="text-xs font-mono text-slate-500">{rules.length} rules</span>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full mx-auto" /></div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldOff size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No suppression rules configured</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: rule.is_active ? 'rgba(46,213,115,0.1)' : 'rgba(136,136,160,0.1)' }}>
                  <Shield size={14} style={{ color: rule.is_active ? '#2ed573' : '#8888a0' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">{rule.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={rule.is_active ? { background: 'rgba(46,213,115,0.1)', color: '#2ed573' } : { background: 'rgba(136,136,160,0.1)', color: '#8888a0' }}>
                      {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-500">
                    {rule.match_service && <span>service: {rule.match_service}</span>}
                    {rule.match_severity && <span>severity: {rule.match_severity}</span>}
                    {rule.match_source && <span>source: {rule.match_source}</span>}
                    <span>duration: {Math.round(rule.duration_seconds / 3600)}h</span>
                    {rule.reason && <span className="text-slate-600">· {rule.reason}</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Created {timeAgo(rule.created_at)} by {rule.created_by || 'unknown'}
                    {rule.expires_at && ` · expires ${formatTime(rule.expires_at)}`}
                  </p>
                </div>
                <button onClick={() => handleDelete(rule.id)}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
