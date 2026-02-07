import { Router } from 'express'
import { ProjectController } from '../controllers/ProjectController'
import { validateProjectId, validateServiceSelection } from '../middleware/validation'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

// Get all projects (admin)
router.get('/', ProjectController.getAllProjects)

// Create new project (admin)
router.post('/', ProjectController.createProject)

// Get all simple projects (public, no auth required)
router.get('/simple', ProjectController.getSimpleProjects)

// Get all projects for authenticated client (uses JWT)
router.get('/my-projects', authenticate, ProjectController.getMyProjects)

// Get all projects for a client (by email) - for admin use
router.get('/client/:email', ProjectController.getClientProjects)

// Get or create an unclaimed project so client can submit requirements and pay (when catalog project is already taken)
router.post('/start-from-catalog', authenticate, ProjectController.startFromCatalog)

// Get project by ID (optionalAuth so we can enforce client ownership when logged in)
router.get('/:projectId', validateProjectId, optionalAuth, ProjectController.getProject)

// Get project with full details (optionalAuth for client ownership check)
router.get('/:projectId/details', validateProjectId, optionalAuth, ProjectController.getProjectDetails)

// Update service selection
router.post('/:projectId/service', validateProjectId, validateServiceSelection, ProjectController.updateServiceSelection)

// Update project status
router.patch('/:projectId/status', validateProjectId, ProjectController.updateStatus)

// Claim revision (client)
router.post('/:projectId/claim-revision', validateProjectId, ProjectController.claimRevision)

// Assign collaborator
router.post('/:projectId/assign-collaborator', validateProjectId, ProjectController.assignCollaborator)

// Unassign collaborator
router.post('/:projectId/unassign-collaborator', validateProjectId, ProjectController.unassignCollaborator)

// Approve invoice (admin)
router.post('/:projectId/invoice/approve', validateProjectId, authenticate, ProjectController.approveInvoice)

// Reject invoice (admin)
router.post('/:projectId/invoice/reject', validateProjectId, authenticate, ProjectController.rejectInvoice)

// Get all monthly invoices (admin)
router.get('/invoices/monthly', authenticate, ProjectController.getMonthlyInvoices)

export default router

