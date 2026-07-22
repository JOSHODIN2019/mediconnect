import Notification from '../models/Notification.js'

/* ── GET /api/notifications/all ── Admin only: see all notifications ── */
export const getAllNotifications = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(100)
    .populate('recipient', 'fullName email role').lean()
  res.json({ success: true, total: notifications.length, notifications })
}

/* ── GET /api/notifications ── */
export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false })

  res.json({ success: true, notifications, unreadCount })
}

/* ── PUT /api/notifications/:id/read ── */
export const markRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  )
  res.json({ success: true })
}

/* ── PUT /api/notifications/read-all ── */
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true })
  res.json({ success: true })
}

/* ── DELETE /api/notifications/:id ── */
export const deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id })
  res.json({ success: true })
}
