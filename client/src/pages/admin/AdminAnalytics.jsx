import { useEffect, useState, useCallback } from 'react'
import api from '@/services/authService'
import { Spinner, Alert } from '@/components/ui'

const DAYS_OPTIONS = [7, 14, 30, 60, 90]

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [days,    setDays]    = useState(30)

  const load = useCallback((d) => {
    setLoading(true)
    api.get('/admin/analytics', { params: { days: d } })
      .then(r => { setData(r.data); setError(null) })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(days) }, [days, load])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Analytics & Reports</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Platform-wide statistics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={[
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                days === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-blue-300',
              ].join(' ')}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="blue" />
        </div>
      ) : data ? (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <OverviewCard label="Appointments"  value={data.overview.totalAppts}         color="blue"   icon={<CalIcon />} />
            <OverviewCard label="Patients"      value={data.overview.totalPatients}       color="emerald" icon={<PatientIcon />} />
            <OverviewCard label="Doctors"       value={data.overview.totalDoctors}        color="purple" icon={<DoctorIcon />} />
            <OverviewCard label="Records"       value={data.overview.totalRecords}        color="orange" icon={<RecordIcon />} />
            <OverviewCard label="Prescriptions" value={data.overview.totalPrescriptions}  color="pink"   icon={<RxIcon />} />
          </div>

          {/* Trend charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Appointment Trend" subtitle={`Last ${days} days`}>
              <LineChart
                series={data.trends.appointments}
                labels={data.trends.labels}
                color="#2563eb"
                fillColor="rgba(37,99,235,0.08)"
              />
            </ChartCard>
            <ChartCard title="New Registrations" subtitle={`Patients & doctors — last ${days} days`}>
              <LineChart
                series={data.trends.users}
                labels={data.trends.labels}
                color="#059669"
                fillColor="rgba(5,150,105,0.08)"
              />
            </ChartCard>
          </div>

          {/* Breakdown row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Appointment Status" subtitle="All-time distribution">
              <DonutChart
                segments={data.breakdowns.status.map(s => ({
                  label: capitalize(s._id || 'unknown'),
                  value: s.count,
                  color: statusColor(s._id),
                }))}
              />
            </ChartCard>
            <ChartCard title="Consultation Types" subtitle="By appointment channel">
              <BarChart
                bars={data.breakdowns.consult.map(c => ({
                  label: capitalize(c._id || 'other'),
                  value: c.count,
                  color: consultColor(c._id),
                }))}
              />
            </ChartCard>
            <ChartCard title="Record Types" subtitle="Medical record breakdown">
              <HorizBar
                bars={data.breakdowns.recordTypes.map(r => ({
                  label: capitalize(r._id || 'other'),
                  value: r.count,
                }))}
              />
            </ChartCard>
          </div>

          {/* Top Doctors */}
          {data.topDoctors?.length > 0 && (
            <ChartCard title="Top Doctors by Appointments" subtitle="Ranked by total consultations">
              <div className="mt-2 space-y-3">
                {data.topDoctors.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-neutral-800 truncate">{doc.name || 'Unknown'}</span>
                        <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">{doc.completed}/{doc.total} completed</span>
                      </div>
                      <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.round((doc.total / (data.topDoctors[0]?.total || 1)) * 100)}%` }}
                        />
                      </div>
                      {doc.spec && <p className="text-[10px] text-neutral-400 mt-0.5">{doc.spec}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      ) : null}
    </div>
  )
}

/* ── OverviewCard ── */
function OverviewCard({ label, value, color, icon }) {
  const cm = {
    blue:   'bg-blue-50   text-blue-600',
    emerald:'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    pink:   'bg-pink-50   text-pink-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className={`w-9 h-9 rounded-xl ${cm[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value ?? 0}</p>
      <p className="text-sm text-neutral-500 mt-0.5 font-medium">{label}</p>
    </div>
  )
}

/* ── ChartCard wrapper ── */
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <p className="font-semibold text-neutral-900 text-sm">{title}</p>
      {subtitle && <p className="text-xs text-neutral-400 mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

/* ── LineChart (SVG) ── */
function LineChart({ series, labels, color, fillColor }) {
  if (!series?.length) return <EmptyChart />
  const W = 560, H = 120, PAD = { t: 10, r: 10, b: 28, l: 36 }
  const inner = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b }
  const vals = series.map(s => s.value)
  const max  = Math.max(...vals, 1)

  const toX = (i) => PAD.l + (i / Math.max(series.length - 1, 1)) * inner.w
  const toY = (v) => PAD.t + inner.h - (v / max) * inner.h

  const pts = series.map((s, i) => `${toX(i)},${toY(s.value)}`).join(' ')
  const areaPath = [
    `M ${toX(0)},${PAD.t + inner.h}`,
    ...series.map((s, i) => `L ${toX(i)},${toY(s.value)}`),
    `L ${toX(series.length - 1)},${PAD.t + inner.h}`,
    'Z',
  ].join(' ')

  // y-axis ticks
  const ticks = [0, Math.round(max / 2), max]

  // x-axis label stride — show ~5-6 labels
  const stride = Math.max(1, Math.floor(series.length / 5))
  const xLabels = series.map((s, i) => (i % stride === 0 || i === series.length - 1 ? { i, label: s.date?.slice(0, 5) || labels?.[i] || '' } : null)).filter(Boolean)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />
      {/* Y grid lines */}
      {ticks.map(t => (
        <g key={t}>
          <line x1={PAD.l} y1={toY(t)} x2={PAD.l + inner.w} y2={toY(t)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={PAD.l - 4} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{t}</text>
        </g>
      ))}
      {/* Line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots on non-zero values */}
      {series.map((s, i) => s.value > 0 && (
        <circle key={i} cx={toX(i)} cy={toY(s.value)} r="3" fill="white" stroke={color} strokeWidth="1.5" />
      ))}
      {/* X labels */}
      {xLabels.map(({ i, label }) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{label}</text>
      ))}
    </svg>
  )
}

/* ── DonutChart ── */
function DonutChart({ segments }) {
  if (!segments?.length) return <EmptyChart />
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const CX = 80, CY = 80, R = 60, r = 38
  let angle = -Math.PI / 2

  // Special case: single 100% segment — arc path is degenerate, use two 180° halves
  const isSingle = segments.length === 1

  const arcs = segments.map(seg => {
    const pct = Math.round((seg.value / total) * 100)
    if (isSingle) {
      // Draw as two arcs of 180° each to form a full circle
      const d = [
        `M ${CX} ${CY - R}`,
        `A ${R} ${R} 0 1 1 ${CX} ${CY + R}`,
        `A ${R} ${R} 0 1 1 ${CX} ${CY - R}`,
        'Z',
      ].join(' ')
      return { ...seg, d, pct }
    }
    const sweep = (seg.value / total) * 2 * Math.PI
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    angle += sweep
    const x2 = CX + R * Math.cos(angle)
    const y2 = CY + R * Math.sin(angle)
    const lf = sweep > Math.PI ? 1 : 0
    return { ...seg, d: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${lf} 1 ${x2} ${y2} Z`, pct }
  })

  return (
    <div className="flex items-center gap-4 mt-2">
      <svg viewBox="0 0 160 160" className="w-32 h-32 flex-shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} />
        ))}
        <circle cx={CX} cy={CY} r={r} fill="white" />
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a" fontFamily="system-ui">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="system-ui">total</text>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: arc.color }} />
            <span className="text-xs text-neutral-600 truncate">{arc.label}</span>
            <span className="text-xs font-semibold text-neutral-800 ml-auto flex-shrink-0">{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Vertical BarChart ── */
function BarChart({ bars }) {
  if (!bars?.length) return <EmptyChart />
  const max = Math.max(...bars.map(b => b.value), 1)
  const H = 100
  return (
    <div className="mt-2 flex items-end gap-2 h-28">
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-bold text-neutral-700 tabular-nums">{b.value}</span>
          <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.round((b.value / max) * H)}px`, background: b.color }} />
          <span className="text-[9px] text-neutral-400 truncate w-full text-center">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Horizontal Bar ── */
function HorizBar({ bars }) {
  if (!bars?.length) return <EmptyChart />
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="mt-2 space-y-2">
      {bars.slice(0, 6).map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-20 text-[11px] text-neutral-600 truncate flex-shrink-0">{b.label}</span>
          <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.round((b.value / max) * 100)}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-neutral-700 w-6 text-right flex-shrink-0 tabular-nums">{b.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return <p className="text-center text-sm text-neutral-300 py-6">No data yet</p>
}

/* ── Helpers ── */
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

function statusColor(s) {
  return { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' }[s] || '#94a3b8'
}
function consultColor(s) {
  return { video: '#6366f1', phone: '#f59e0b', 'in-person': '#10b981' }[s] || '#94a3b8'
}

/* ── Mini icons ── */
function CalIcon()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><path d="M1.5 6.5h13M5 1.5v2M11 1.5v2"/></svg> }
function PatientIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/></svg> }
function DoctorIcon()  { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M6 10h4M8 8.5v4"/></svg> }
function RecordIcon()  { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5l-3.5-3.5z"/><path d="M10 1.5V5H13.5M5.5 9h5M5.5 11h3"/></svg> }
function RxIcon()      { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2h6a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M6.5 7h1.5v3M6.5 8.5h3"/></svg> }
