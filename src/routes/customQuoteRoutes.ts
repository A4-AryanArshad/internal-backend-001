import { Router } from 'express'
import { CustomQuoteController } from '../controllers/CustomQuoteController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validateProjectId } from '../middleware/validation'

const router = Router()

// Client routes (authenticated)
router.post('/request', authenticate, CustomQuoteController.requestStandaloneQuote) // Standalone request from dashboard
router.post('/:projectId/request', authenticate, validateProjectId, CustomQuoteController.requestCustomQuote)
router.get('/:projectId', optionalAuth, validateProjectId, CustomQuoteController.getCustomQuote)
router.post('/:quoteId/accept', authenticate, CustomQuoteController.acceptCustomQuote)

// Admin routes
router.post('/:quoteId/create-project', CustomQuoteController.createProjectFromQuote) // Create project from quote
router.post('/:quoteId/send', validateProjectId, CustomQuoteController.sendCustomQuote)
router.get('/admin/pending', CustomQuoteController.getAllPendingQuotes)

export default router


