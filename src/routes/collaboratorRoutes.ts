import { Router } from 'express'
import { CollaboratorController } from '../controllers/CollaboratorController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Get all collaborators (admin)
router.get('/', CollaboratorController.getAllCollaborators)

// Get payment summary for all collaborators (admin)
router.get('/payments/summary', CollaboratorController.getPaymentSummary)

// Create new collaborator
router.post('/', CollaboratorController.createCollaborator)

// Get projects for currently authenticated collaborator
// IMPORTANT: define this before any routes with :collaboratorId params
router.get('/me/projects', authenticate, CollaboratorController.getMyProjects)

// Stripe Connect routes for collaborators
router.post('/me/stripe/connect', authenticate, CollaboratorController.createStripeConnectLink)
router.get('/me/stripe/status', authenticate, CollaboratorController.getStripeStatus)
router.delete('/me/stripe/disconnect', authenticate, CollaboratorController.disconnectStripe)

// Invoice type management
router.put('/me/invoice-type', authenticate, CollaboratorController.updateInvoiceType)
router.get('/me/monthly-invoice-projects', authenticate, CollaboratorController.getMonthlyInvoiceProjects)

// Get collaborator by ID
router.get('/:collaboratorId', CollaboratorController.getCollaborator)

// Update collaborator
router.put('/:collaboratorId', CollaboratorController.updateCollaborator)

// Delete collaborator
router.delete('/:collaboratorId', CollaboratorController.deleteCollaborator)

// Get projects assigned to collaborator (by ID)
router.get('/:collaboratorId/projects', CollaboratorController.getCollaboratorProjects)

export default router



