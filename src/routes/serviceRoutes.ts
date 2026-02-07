import { Router } from 'express'
import { ServiceController } from '../controllers/ServiceController'

const router = Router()

// Get all active services
router.get('/', ServiceController.getServices)

// Get service by ID
router.get('/:serviceId', ServiceController.getService)

export default router




















