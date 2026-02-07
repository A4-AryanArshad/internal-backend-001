"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProjectController_1 = require("../controllers/ProjectController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all projects (admin)
router.get('/', ProjectController_1.ProjectController.getAllProjects);
// Create new project (admin)
router.post('/', ProjectController_1.ProjectController.createProject);
// Get all simple projects (public, no auth required)
router.get('/simple', ProjectController_1.ProjectController.getSimpleProjects);
// Get all projects for authenticated client (uses JWT)
router.get('/my-projects', auth_1.authenticate, ProjectController_1.ProjectController.getMyProjects);
// Get all projects for a client (by email) - for admin use
router.get('/client/:email', ProjectController_1.ProjectController.getClientProjects);
// Get or create an unclaimed project so client can submit requirements and pay (when catalog project is already taken)
router.post('/start-from-catalog', auth_1.authenticate, ProjectController_1.ProjectController.startFromCatalog);
// Get project by ID (optionalAuth so we can enforce client ownership when logged in)
router.get('/:projectId', validation_1.validateProjectId, auth_1.optionalAuth, ProjectController_1.ProjectController.getProject);
// Get project with full details (optionalAuth for client ownership check)
router.get('/:projectId/details', validation_1.validateProjectId, auth_1.optionalAuth, ProjectController_1.ProjectController.getProjectDetails);
// Update service selection
router.post('/:projectId/service', validation_1.validateProjectId, validation_1.validateServiceSelection, ProjectController_1.ProjectController.updateServiceSelection);
// Update project status
router.patch('/:projectId/status', validation_1.validateProjectId, ProjectController_1.ProjectController.updateStatus);
// Claim revision (client)
router.post('/:projectId/claim-revision', validation_1.validateProjectId, ProjectController_1.ProjectController.claimRevision);
// Assign collaborator
router.post('/:projectId/assign-collaborator', validation_1.validateProjectId, ProjectController_1.ProjectController.assignCollaborator);
// Unassign collaborator
router.post('/:projectId/unassign-collaborator', validation_1.validateProjectId, ProjectController_1.ProjectController.unassignCollaborator);
// Approve invoice (admin)
router.post('/:projectId/invoice/approve', validation_1.validateProjectId, auth_1.authenticate, ProjectController_1.ProjectController.approveInvoice);
// Reject invoice (admin)
router.post('/:projectId/invoice/reject', validation_1.validateProjectId, auth_1.authenticate, ProjectController_1.ProjectController.rejectInvoice);
// Get all monthly invoices (admin)
router.get('/invoices/monthly', auth_1.authenticate, ProjectController_1.ProjectController.getMonthlyInvoices);
exports.default = router;
