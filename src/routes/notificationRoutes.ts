import { Router } from 'express'
import { NotificationController } from '../controllers/NotificationController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, NotificationController.getMine)
router.get('/unread-count', authenticate, NotificationController.getUnreadCount)
router.patch('/read-all', authenticate, NotificationController.markAllRead)
router.patch('/:notificationId/read', authenticate, NotificationController.markRead)

export default router
