import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  getHistory,
  getConversations,
  sendMessage,
  getUnreadCount,
} from '../controllers/messageController.js'

const router = Router()
router.use(protect)

router.get('/conversations',    getConversations)
router.get('/unread-count',     getUnreadCount)
router.get('/:partnerId',       getHistory)
router.post('/',                sendMessage)

export default router
