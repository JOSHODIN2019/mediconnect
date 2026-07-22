import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const instanceRef = useRef(null)       // for cleanup — never triggers re-render
  const [socket,     setSocket]     = useState(null) // in state so consumers react to it
  const [connected,  setConnected]  = useState(false)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      instanceRef.current?.disconnect()
      instanceRef.current = null
      setSocket(null)
      setConnected(false)
      return
    }

    const token = localStorage.getItem('mediconnect_token')
    if (!token) return

    const s = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
      {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      }
    )

    instanceRef.current = s
    setSocket(s)  // put into state immediately — consumers get a real reference

    s.on('connect',    () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    // new_chat_message is only for the notification badge — actual message delivery
    // uses receive_message emitted to personal + chat rooms
    s.on('new_chat_message', () => setChatUnread(prev => prev + 1))

    return () => {
      s.disconnect()
      instanceRef.current = null
      setSocket(null)
      setConnected(false)
    }
  }, [isAuthenticated])

  const clearChatUnread = () => setChatUnread(0)

  return (
    <SocketContext.Provider value={{ socket, connected, chatUnread, clearChatUnread }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
