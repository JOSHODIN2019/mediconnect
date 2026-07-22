import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediconnect_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const TYPE_ICON = {
  RECORD_UPLOADED:         '📄',
  ACCESS_GRANTED:          '🔓',
  ACCESS_REVOKED:          '🔒',
  TAMPER_DETECTED:         '⚠️',
  ACCOUNT_CREATED:         '🎉',
  APPOINTMENT_BOOKED:      '📅',
  APPOINTMENT_CONFIRMED:   '✅',
  APPOINTMENT_CANCELLED:   '❌',
  APPOINTMENT_COMPLETED:   '🏥',
  APPOINTMENT_RESCHEDULED: '🔄',
  PRESCRIPTION_ISSUED:     '💊',
  NEW_MESSAGE:             '💬',
}

const TYPE_COLOR = {
  RECORD_UPLOADED:         '#2563eb',
  ACCESS_GRANTED:          '#059669',
  ACCESS_REVOKED:          '#d97706',
  TAMPER_DETECTED:         '#dc2626',
  ACCOUNT_CREATED:         '#7c3aed',
  APPOINTMENT_BOOKED:      '#0284c7',
  APPOINTMENT_CONFIRMED:   '#059669',
  APPOINTMENT_CANCELLED:   '#dc2626',
  APPOINTMENT_COMPLETED:   '#0891b2',
  APPOINTMENT_RESCHEDULED: '#d97706',
  PRESCRIPTION_ISSUED:     '#ea580c',
  NEW_MESSAGE:             '#7c3aed',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationBell() {
  const { socket } = useSocket()
  const { user }   = useAuth()
  const notifPath  = user?.role === 'doctor' ? '/doctor/notifications' : '/patient/notifications'
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [open,          setOpen]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch {
      // silently ignore — bell should never crash the app
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return
    const refresh = () => fetchNotifications()
    socket.on('new_notification_count', refresh)
    socket.on('new_chat_message', refresh)
    return () => {
      socket.off('new_notification_count', refresh)
      socket.off('new_chat_message', refresh)
    }
  }, [socket, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    setLoading(true)
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const deleteOne = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      const removed = notifications.find(n => n._id === id)
      setNotifications(prev => prev.filter(n => n._id !== id))
      if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:   'relative',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          padding:    '6px',
          borderRadius: '8px',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color:      '#64748b',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
        title="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position:   'absolute',
            top:        '2px',
            right:      '2px',
            background: '#dc2626',
            color:      '#fff',
            fontSize:   '10px',
            fontWeight: '700',
            borderRadius: '999px',
            minWidth:   '16px',
            height:     '16px',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding:    '0 3px',
            lineHeight: '1',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:   'absolute',
          right:      0,
          top:        'calc(100% + 8px)',
          width:      '360px',
          background: '#fff',
          border:     '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow:  '0 10px 25px rgba(0,0,0,0.12)',
          zIndex:     1000,
          overflow:   'hidden',
        }}>
          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '14px 16px',
            borderBottom:   '1px solid #f1f5f9',
          }}>
            <span style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft:   '8px',
                  background:   '#eff6ff',
                  color:        '#2563eb',
                  fontSize:     '12px',
                  fontWeight:   '600',
                  padding:      '1px 7px',
                  borderRadius: '999px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  fontSize:   '13px',
                  color:      '#2563eb',
                  fontWeight: '500',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <div style={{ fontSize: '14px' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markOneRead(n._id)}
                  style={{
                    display:    'flex',
                    gap:        '12px',
                    padding:    '12px 16px',
                    cursor:     n.isRead ? 'default' : 'pointer',
                    background: n.isRead ? '#fff' : '#f8faff',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s',
                    position:   'relative',
                  }}
                  onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.background = '#f8faff' }}
                >
                  {/* Unread dot */}
                  {!n.isRead && (
                    <div style={{
                      position:     'absolute',
                      left:         '6px',
                      top:          '50%',
                      transform:    'translateY(-50%)',
                      width:        '6px',
                      height:       '6px',
                      borderRadius: '50%',
                      background:   '#2563eb',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width:        '36px',
                    height:       '36px',
                    borderRadius: '8px',
                    background:   (TYPE_COLOR[n.type] || '#64748b') + '15',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontSize:     '18px',
                    flexShrink:   0,
                  }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize:   '13px',
                      fontWeight: n.isRead ? '500' : '600',
                      color:      '#0f172a',
                      marginBottom: '2px',
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize:     '12px',
                      color:        '#64748b',
                      lineHeight:   '1.4',
                      whiteSpace:   'normal',
                      wordBreak:    'break-word',
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteOne(n._id, e)}
                    style={{
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      color:      '#cbd5e1',
                      fontSize:   '16px',
                      padding:    '2px 4px',
                      borderRadius: '4px',
                      alignSelf:  'flex-start',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          {/* Footer — View all link */}
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 16px' }}>
            <Link
              to={notifPath}
              onClick={() => setOpen(false)}
              style={{
                display:       'block',
                textAlign:     'center',
                fontSize:      '13px',
                fontWeight:    '500',
                color:         '#2563eb',
                textDecoration: 'none',
                padding:       '4px',
                borderRadius:  '6px',
                transition:    'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
