import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public routes
router.post('/signup', AuthController.signup)
router.post('/login', AuthController.login)

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser)

export default router


















