import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Avatar, Spinner } from '@/components/ui'
import api from '@/services/authService'

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}
function fmtDay(d) {
  const dt = new Date(d)
  const today = new Date()
  if (dt.toDateString() === today.toDateString()) return 'Today'
  const yest = new Date(); yest.setDate(yest.getDate() - 1)
  if (dt.toDateString() === yest.toDateString()) return 'Yesterday'
  return dt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export default function DoctorChat() {
  const { user }      = useAuth()
  const { socket }    = useSocket()
  const { partnerId } = useParams()
  const navigate      = useNavigate()

  const [conversations, setConversations] = useState([])
  const [messages,      setMessages]      = useState([])
  const [partner,       setPartner]       = useState(null)
  const [text,          setText]          = useState('')
  const [loadingConvs,  setLoadingConvs]  = useState(true)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)

  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const activeRoom   = useRef(null)
  const partnerIdRef = useRef(partnerId)

  useEffect(() => { partnerIdRef.current = partnerId }, [partnerId])

  const loadConversations = useCallback(async () => {
    try {
      const r = await api.get('/messages/conversations')
      setConversations(r.data.conversations || [])
    } catch { /* silent */ }
    finally { setLoadingConvs(false) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Load history + partner info when partnerId changes
  useEffect(() => {
    if (!partnerId) { setMessages([]); setPartner(null); return }
    setLoadingMsgs(true)
    api.get(`/messages/${partnerId}`)
      .then(r => {
        setMessages(r.data.messages || [])
        // Server returns the partner user directly — no client-side inference needed
        if (r.data.partner) setPartner(r.data.partner)
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [partnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const onMessage = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev

        const pid = partnerIdRef.current
        if (!pid) return prev
        const uid      = user._id?.toString()
        const senderId = msg.sender?._id?.toString() || String(msg.sender || '')
        const recvId   = msg.receiver?._id?.toString() || String(msg.receiver || '')
        const relevant = (senderId === uid && recvId === pid) ||
                         (senderId === pid && recvId === uid)
        if (!relevant) return prev

        return [...prev, msg]
      })
      loadConversations()
    }

    const onRead = ({ room }) => {
      if (room !== activeRoom.current) return
      setMessages(prev =>
        prev.map(m =>
          m.sender._id === user._id || m.sender._id?.toString() === user._id?.toString()
            ? { ...m, isRead: true }
            : m
        )
      )
    }

    socket.on('receive_message', onMessage)
    socket.on('messages_read',   onRead)

    return () => {
      socket.off('receive_message', onMessage)
      socket.off('messages_read',   onRead)
    }
  }, [socket, user._id, loadConversations])

  // Join room
  useEffect(() => {
    if (!socket || !partnerId) return
    socket.emit('join_room', partnerId)
    activeRoom.current = ['chat', ...[user._id, partnerId].map(String).sort()].join('_')
  }, [socket, partnerId, user._id])

  const send = () => {
    const content = text.trim()
    if (!content || !partnerId || !socket) return
    setText('')
    socket.emit('send_message', { receiverId: partnerId, content })
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const grouped = messages.reduce((acc, msg) => {
    const day = fmtDay(msg.createdAt)
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-neutral-50">

      {/* ── Sidebar ── */}
      <div className={[
        'w-full sm:w-72 flex-shrink-0 border-r border-neutral-200 bg-white flex flex-col',
        partnerId ? 'hidden sm:flex' : 'flex',
      ].join(' ')}>
        <div className="px-4 py-4 border-b border-neutral-100">
          <h1 className="font-bold text-neutral-900 text-base">Messages</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Patient conversations</p>
        </div>

        {loadingConvs ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <ChatEmptyIcon />
            </div>
            <p className="text-sm font-medium text-neutral-700">No conversations yet</p>
            <p className="text-xs text-neutral-400 leading-relaxed">Patients who message you will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.partner._id}
                onClick={() => navigate(`/doctor/chat/${conv.partner._id}`)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-neutral-50',
                  partnerId === conv.partner._id
                    ? 'bg-emerald-50 border-l-2 border-l-emerald-600'
                    : 'hover:bg-neutral-50',
                ].join(' ')}
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={conv.partner.fullName} size="sm" />
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                    {conv.partner.fullName}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{conv.lastMessage?.content || ''}</p>
                </div>
                <p className="text-[10px] text-neutral-400 flex-shrink-0">{fmtTime(conv.lastMessage?.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Chat panel ── */}
      {!partnerId ? (
        <div className="hidden sm:flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
              <ChatEmptyIcon />
            </div>
            <p className="text-neutral-600 font-medium">Select a conversation</p>
            <p className="text-sm text-neutral-400">Choose a patient from the list to start chatting.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-neutral-200 flex-shrink-0">
            <button
              onClick={() => navigate('/doctor/chat')}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500"
            >
              <BackIcon />
            </button>
            {partner && <Avatar name={partner.fullName} size="sm" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-neutral-900">{partner?.fullName || '…'}</p>
              <p className="text-xs text-neutral-400">Patient</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loadingMsgs ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <ChatEmptyIcon small />
                </div>
                <p className="text-sm text-neutral-500">Send a message to start the conversation</p>
              </div>
            ) : (
              Object.entries(grouped).map(([day, msgs]) => (
                <div key={day}>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-neutral-100" />
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{day}</span>
                    <div className="flex-1 h-px bg-neutral-100" />
                  </div>
                  <div className="space-y-1">
                    {msgs.map((msg) => {
                      const mine = msg.sender._id === user._id || msg.sender._id?.toString() === user._id?.toString()
                      return (
                        <div key={msg._id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                          <div className={[
                            'max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                            mine
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm shadow-sm',
                          ].join(' ')}>
                            <p>{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] text-neutral-400">{fmtTime(msg.createdAt)}</span>
                            {mine && <ReadTick isRead={msg.isRead} accent="emerald" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-neutral-200 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || !socket}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadTick({ isRead, accent = 'blue' }) {
  const color = isRead ? (accent === 'emerald' ? '#059669' : '#2563eb') : '#9ca3af'
  return isRead ? (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="flex-shrink-0">
      <path d="M1 5l3 3 5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5l3 3 5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
      <path d="M1 5l3 3 5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChatEmptyIcon({ small }) {
  const s = small ? 20 : 26
  return <svg width={s} height={s} viewBox="0 0 26 26" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"><path d="M22 4H4a2 2 0 00-2 2v12a2 2 0 002 2h14l4 4V6a2 2 0 00-2-2z"/><path d="M8 10h10M8 14h6"/></svg>
}
function SendIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2L2 7l5 3 3 5 4-13z"/><path d="M7 9l3-3"/></svg>
}
function BackIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
}
