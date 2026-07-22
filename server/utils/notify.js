import Notification from '../models/Notification.js'

export const notify = async ({ recipient, type, title, message, data = {} }) => {
  try {
    await Notification.create({ recipient, type, title, message, data })
  } catch (err) {
    console.error('Failed to create notification:', err.message)
  }
}
