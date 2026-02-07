"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CollaboratorController_1 = require("../controllers/CollaboratorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all collaborators (admin)
router.get('/', CollaboratorController_1.CollaboratorController.getAllCollaborators);
// Get payment summary for all collaborators (admin)
router.get('/payments/summary', CollaboratorController_1.CollaboratorController.getPaymentSummary);
// Create new collaborator
router.post('/', CollaboratorController_1.CollaboratorController.createCollaborator);
// Get projects for currently authenticated collaborator
// IMPORTANT: define this before any routes with :collaboratorId params
router.get('/me/projects', auth_1.authenticate, CollaboratorController_1.CollaboratorController.getMyProjects);
// Stripe Connect routes for collaborators
router.post('/me/stripe/connect', auth_1.authenticate, CollaboratorController_1.CollaboratorController.createStripeConnectLink);
router.get('/me/stripe/status', auth_1.authenticate, CollaboratorController_1.CollaboratorController.getStripeStatus);
router.delete('/me/stripe/disconnect', auth_1.authenticate, CollaboratorController_1.CollaboratorController.disconnectStripe);
// Invoice type management
router.put('/me/invoice-type', auth_1.authenticate, CollaboratorController_1.CollaboratorController.updateInvoiceType);
router.get('/me/monthly-invoice-projects', auth_1.authenticate, CollaboratorController_1.CollaboratorController.getMonthlyInvoiceProjects);
// Get collaborator by ID
router.get('/:collaboratorId', CollaboratorController_1.CollaboratorController.getCollaborator);
// Update collaborator
router.put('/:collaboratorId', CollaboratorController_1.CollaboratorController.updateCollaborator);
// Delete collaborator
router.delete('/:collaboratorId', CollaboratorController_1.CollaboratorController.deleteCollaborator);
// Get projects assigned to collaborator (by ID)
router.get('/:collaboratorId/projects', CollaboratorController_1.CollaboratorController.getCollaboratorProjects);
exports.default = router;
