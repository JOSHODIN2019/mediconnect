import express        from 'express'
import compression    from 'compression'
import cors           from 'cors'
import helmet         from 'helmet'
import morgan         from 'morgan'
import dotenv         from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createServer } from 'http'
import { Server }     from 'socket.io'
import jwt            from 'jsonwebtoken'
import { connectDB }  from './config/db.js'
import { seedAdmin }  from './config/seed.js'
import User           from './models/User.js'
import Message        from './models/Message.js'
import { roomName }   from './controllers/messageController.js'
import authRoutes         from './routes/auth.js'
import adminRoutes        from './routes/admin.js'
import patientRoutes      from './routes/patient.js'
import doctorRoutes       from './routes/doctor.js'
import notificationRoutes from './routes/notificationRoutes.js'
import settingsRoutes     from './routes/settingsRoutes.js'
import videoRoutes        from './routes/video.js'
import messageRoutes      from './routes/message.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '.env') })

const app    = express()
const server = createServer(app)
const PORT   = process.env.PORT || 5000

const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',')

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
})

// Socket JWT auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token'))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) return next(new Error('User not found'))
    socket.user = user
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const user = socket.user

  // Each user joins their own personal notification room
  socket.join(`user_${user._id}`)

  // Join a chat room
  socket.on('join_room', (partnerId) => {
    const room = roomName(user._id, partnerId)
    socket.join(room)
  })

  // Real-time message
  socket.on('send_message', async ({ receiverId, content }) => {
    try {
      if (!content?.trim() || !receiverId) return
      // Prevent self-messaging
      if (String(receiverId) === String(user._id)) return
      const room = roomName(user._id, receiverId)
      const msg  = await Message.create({
        room,
        sender:   user._id,
        receiver: receiverId,
        content:  content.trim(),
      })
      const populated = await msg.populate([
        { path: 'sender',   select: 'fullName role specialization' },
        { path: 'receiver', select: 'fullName role specialization' },
      ])

      // Primary: broadcast to everyone in the chat room
      io.to(room).emit('receive_message', populated)
      // Belt-and-suspenders: also deliver directly to each user's personal room
      // so messages arrive even if a socket missed the join_room event
      io.to(`user_${user._id}`).emit('receive_message', populated)
      io.to(`user_${receiverId}`).emit('receive_message', populated)

      // Notification ping for the receiver
      io.to(`user_${receiverId}`).emit('new_chat_message', {
        from: { _id: user._id, fullName: user.fullName },
        preview: content.trim().slice(0, 60),
      })
    } catch (err) {
      console.error('[socket] send_message error:', err)
    }
  })

  socket.on('disconnect', () => {})
})

// ── Expose io on every request ─────────────────────────────────────────────
app.use((req, _res, next) => { req.io = io; next() })

// ── Express middleware ─────────────────────────────────────────────────────
app.use(compression())
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MediConnect API running', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/patient',       patientRoutes)
app.use('/api/doctor',        doctorRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings',      settingsRoutes)
app.use('/api/video',         videoRoutes)
app.use('/api/messages',      messageRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

const start = async () => {
  await connectDB()
  await seedAdmin()
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
