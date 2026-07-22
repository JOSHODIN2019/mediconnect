import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getVideoToken } from '../controllers/videoController.js'

const router = Router()
router.get('/token', protect, getVideoToken)
export default router
