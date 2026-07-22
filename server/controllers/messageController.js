import Message from '../models/Message.js'
import User    from '../models/User.js'

// Deterministic room name: sort both IDs so patient+doctor = doctor+patient
export const roomName = (idA, idB) =>
  ['chat', ...[idA, idB].map(String).sort()].join('_')

// GET /api/messages/:partnerId — load history with one user
export const getHistory = async (req, res) => {
  try {
    const partnerId = req.params.partnerId

    // Look up the partner user directly — client should never have to infer identity from messages
    const partner = await User.findById(partnerId)
      .select('fullName role specialization hospital')

    const room = roomName(req.user._id, partnerId)
    const messages = await Message.find({ room })
      .populate('sender',   'fullName role specialization')
      .populate('receiver', 'fullName role specialization')
      .sort({ createdAt: 1 })
      .limit(200)

    // Mark unread messages as read and notify senders
    const unread = await Message.find(
      { room, receiver: req.user._id, isRead: false },
      'sender'
    )
    if (unread.length) {
      await Message.updateMany(
        { room, receiver: req.user._id, isRead: false },
        { isRead: true }
      )
      const senderIds = [...new Set(unread.map(m => m.sender.toString()))]
      senderIds.forEach(sid => {
        req.io?.to(`user_${sid}`).emit('messages_read', { room })
      })
    }

    res.json({ success: true, messages, partner })
  } catch (err) {
    console.error('[messageController] getHistory:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/messages/conversations — list all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString()

    // Find all rooms this user participated in
    const allMsgs = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender',   'fullName role specialization hospital')
      .populate('receiver', 'fullName role specialization hospital')
      .sort({ createdAt: -1 })

    // Patients only converse with doctors; doctors only with patients
    const validPartnerRoles = req.user.role === 'patient' ? ['doctor'] : ['patient']

    // Build a map: partnerId → latest message + unread count
    const convMap = new Map()
    for (const msg of allMsgs) {
      const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender
      if (!partner) continue                        // skip if partner was deleted
      const pid = partner._id.toString()
      if (pid === userId) continue                  // skip self-conversation entries
      if (!validPartnerRoles.includes(partner.role)) continue  // skip wrong-role partners
      if (!convMap.has(pid)) {
        const unread = await Message.countDocuments({
          room: msg.room,
          receiver: req.user._id,
          isRead: false,
        })
        convMap.set(pid, {
          partner,
          lastMessage: msg,
          unread,
          room: msg.room,
        })
      }
    }

    res.json({ success: true, conversations: [...convMap.values()] })
  } catch (err) {
    console.error('[messageController] getConversations:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/messages — send a message via REST (socket is primary; REST is fallback)
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body
    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'receiverId and content are required' })
    }

    const receiver = await User.findById(receiverId)
    if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found' })

    const room = roomName(req.user._id, receiverId)
    const msg  = await Message.create({
      room,
      sender:   req.user._id,
      receiver: receiverId,
      content:  content.trim(),
    })

    const populated = await msg.populate('sender', 'fullName role')

    // Emit via socket if available
    if (req.io) {
      req.io.to(room).emit('receive_message', populated)
      req.io.to(`user_${receiverId}`).emit('new_notification_count')
    }

    res.status(201).json({ success: true, message: populated })
  } catch (err) {
    console.error('[messageController] sendMessage:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/messages/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, isRead: false })
    res.json({ success: true, count })
  } catch {
    res.json({ success: true, count: 0 })
  }
}
