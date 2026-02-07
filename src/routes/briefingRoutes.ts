import { Router } from 'express'
import { BriefingController } from '../controllers/BriefingController'
import { validateProjectId, validateBriefing } from '../middleware/validation'

const router = Router()

// Get briefing
router.get('/:projectId', validateProjectId, BriefingController.getBriefing)

// Submit briefing
router.post('/:projectId/submit', validateProjectId, validateBriefing, BriefingController.submitBriefing)

export default router




















