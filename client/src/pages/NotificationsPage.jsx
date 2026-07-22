import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import api from '@/services/authService'
import { Spinner } from '@/components/ui'

const TYPE_META = {
  APPOINTMENT_BOOKED:      { emoji: '📅', color: '#0284c7', cat: 'appointments' },
  APPOINTMENT_CONFIRMED:   { emoji: '✅', color: '#059669', cat: 'appointments' },
  APPOINTMENT_CANCELLED:   { emoji: '❌', color: '#dc2626', cat: 'appointments' },
  APPOINTMENT_COMPLETED:   { emoji: '🏥', color: '#0891b2', cat: 'appointments' },
  APPOINTMENT_RESCHEDULED: { emoji: '🔄', color: '#d97706', cat: 'appointments' },
  PRESCRIPTION_ISSUED:     { emoji: '💊', color: '#ea580c', cat: 'prescriptions' },
  RECORD_UPLOADED:         { emoji: '📄', color: '#2563eb', cat: 'records'       },
  TAMPER_DETECTED:         { emoji: '⚠️', color: '#dc2626', cat: 'records'       },
  ACCESS_GRANTED:          { emoji: '🔓', color: '#059669', cat: 'access'        },
  ACCESS_REVOKED:          { emoji: '🔒', color: '#d97706', cat: 'access'        },
  NEW_MESSAGE:             { emoji: '💬', color: '#7c3aed', cat: 'messages'      },
  ACCOUNT_CREATED:         { emoji: '🎉', color: '#7c3aed', cat: 'system'        },
}

const FILTERS = [
  { key: 'all',           label: 'All'           },
  { key: 'appointments',  label: 'Appointments'  },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'records',       label: 'Records'       },
  { key: 'access',        label: 'Access'        },
  { key: 'messages',      label: 'Messages'      },
  { key: 'system',        label: 'System'        },
]

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function groupByDate(list) {
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups    = {}
  list.forEach(n => {
    const d     = new Date(n.createdAt).toDateString()
    const label = d === today     ? 'Today'
                : d === yesterday ? 'Yesterday'
                : new Date(n.createdAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })
  return groups
}

export default function NotificationsPage() {
  const { user }   = useAuth()
  const { socket } = useSocket()

  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('all')
  const [busy,          setBusy]          = useState(false)

  const isDoctor = user?.role === 'doctor'

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!socket) return
    const refresh = () => load()
    socket.on('new_notification_count', refresh)
    socket.on('new_chat_message', refresh)
    return () => {
      socket.off('new_notification_count', refresh)
      socket.off('new_chat_message', refresh)
    }
  }, [socket, load])

  /* ── derived ── */
  const catOf = (n) => TYPE_META[n.type]?.cat || 'system'
  const catUnread = {}
  notifications.forEach(n => {
    if (!n.isRead) catUnread[catOf(n)] = (catUnread[catOf(n)] || 0) + 1
  })

  const visible = filter === 'all'
    ? notifications
    : notifications.filter(n => catOf(n) === filter)

  const unreadVisible = visible.filter(n => !n.isRead).length
  const readVisible   = visible.filter(n => n.isRead).length
  const grouped       = groupByDate(visible)

  /* ── actions ── */
  const markRead = async (n) => {
    if (n.isRead) return
    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x))
    setUnreadCount(c => Math.max(0, c - 1))
    try { await api.put(`/notifications/${n._id}/read`) } catch { load() }
  }

  const markAllRead = async () => {
    if (!unreadCount) return
    setBusy(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { load() }
    finally { setBusy(false) }
  }

  const deleteOne = async (id, e) => {
    e.stopPropagation()
    const n = notifications.find(x => x._id === id)
    setNotifications(prev => prev.filter(x => x._id !== id))
    if (n && !n.isRead) setUnreadCount(c => Math.max(0, c - 1))
    try { await api.delete(`/notifications/${id}`) } catch { load() }
  }

  const clearRead = async () => {
    const readIds = notifications.filter(n => n.isRead).map(n => n._id)
    if (!readIds.length) return
    setNotifications(prev => prev.filter(n => !n.isRead))
    try { await Promise.all(readIds.map(id => api.delete(`/notifications/${id}`))) }
    catch { load() }
  }

  const accentBg     = isDoctor ? 'bg-emerald-600' : 'bg-blue-600'
  const accentText   = isDoctor ? 'text-emerald-600' : 'text-blue-600'
  const accentBorder = isDoctor ? 'border-emerald-600' : 'border-blue-600'
  const accentLight  = isDoctor ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={busy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${accentLight}`}
            >
              <CheckAllIcon />
              Mark all read
            </button>
          )}
          {notifications.some(n => n.isRead) && (
            <button
              onClick={clearRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              <TrashIcon />
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => {
          const count = f.key === 'all' ? unreadCount : (catUnread[f.key] || 0)
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active
                  ? `${accentBg} text-white shadow-sm`
                  : 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-700',
              ].join(' ')}
            >
              {f.label}
              {count > 0 && (
                <span className={[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                  active ? 'bg-white/20 text-white' : `${accentLight}`,
                ].join(' ')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="md" /></div>
      ) : visible.length === 0 ? (
        <EmptyState filter={filter} accentBg={accentBg} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">{dateLabel}</p>
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100">
                {items.map(n => {
                  const meta  = TYPE_META[n.type] || { emoji: '🔔', color: '#64748b' }
                  return (
                    <div
                      key={n._id}
                      onClick={() => markRead(n)}
                      className={[
                        'flex items-start gap-3.5 px-4 py-4 relative transition-colors group',
                        n.isRead
                          ? 'cursor-default'
                          : 'cursor-pointer hover:bg-neutral-50',
                      ].join(' ')}
                    >
                      {/* Unread indicator */}
                      {!n.isRead && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                          style={{ background: meta.color }}
                        />
                      )}

                      {/* Type icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                        style={{ background: meta.color + '15' }}
                      >
                        {meta.emoji}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? 'font-medium text-neutral-700' : 'font-semibold text-neutral-900'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                      </div>

                      {/* Read dot + delete */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-start mt-0.5">
                        {!n.isRead && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: meta.color }}
                          />
                        )}
                        <button
                          onClick={(e) => deleteOne(n._id, e)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
                          title="Delete"
                        >
                          <XIcon />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Summary footer */}
          {visible.length > 0 && (
            <p className="text-center text-xs text-neutral-400 pb-2">
              Showing {visible.length} notification{visible.length !== 1 ? 's' : ''}
              {unreadVisible > 0 ? ` · ${unreadVisible} unread` : ''}
              {readVisible > 0   ? ` · ${readVisible} read` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter, accentBg }) {
  const msg = filter === 'all'
    ? { title: 'No notifications yet', sub: 'You\'re all caught up! New activity will appear here.' }
    : { title: `No ${filter} notifications`, sub: 'Nothing in this category yet.' }
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-20 flex flex-col items-center text-center">
      <div className={`w-14 h-14 rounded-2xl ${accentBg} flex items-center justify-center mb-4 opacity-20`}>
        <BellIcon />
      </div>
      <h2 className="font-semibold text-neutral-800 mb-1.5">{msg.title}</h2>
      <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">{msg.sub}</p>
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function CheckAllIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 7l3 3 8-7"/><path d="M5 7l3 3"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3.5h9M4.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M5 6v3.5M8 6v3.5"/><rect x="2.5" y="3.5" width="8" height="8" rx="1"/></svg>
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
}
