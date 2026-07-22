import express from 'express'
import { protect } from '../middleware/auth.js'
import { getProfile, updateProfile, changePassword } from '../controllers/settingsController.js'

const router = express.Router()

router.use(protect)

router.get('/',             getProfile)
router.put('/profile',      updateProfile)
router.put('/password',     changePassword)

export default router
