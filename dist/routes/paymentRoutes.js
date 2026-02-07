"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = require("../controllers/PaymentController");
const validation_1 = require("../middleware/validation");
const express_2 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create Stripe checkout session
router.post('/:projectId/checkout', validation_1.validateProjectId, PaymentController_1.PaymentController.createCheckoutSession);
// Stripe webhook (must use raw body)
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), PaymentController_1.PaymentController.handleWebhook);
// Manually verify payment status (for testing/development)
router.get('/:projectId/verify', validation_1.validateProjectId, PaymentController_1.PaymentController.verifyPayment);
// Handle payment success (called from frontend after Stripe redirect)
router.get('/:projectId/success', validation_1.validateProjectId, PaymentController_1.PaymentController.handlePaymentSuccess);
// Collaborator claims earnings for a completed project
router.post('/:projectId/claim-earnings', auth_1.authenticate, validation_1.validateProjectId, PaymentController_1.PaymentController.claimCollaboratorEarnings);
// Manually mark payment as paid (for testing/development)
router.post('/:projectId/mark-paid', validation_1.validateProjectId, PaymentController_1.PaymentController.markAsPaid);
// Admin pays collaborator for a project invoice (project-based)
router.post('/:projectId/pay-collaborator', auth_1.authenticate, validation_1.validateProjectId, PaymentController_1.PaymentController.payCollaboratorForProject);
// Admin pays collaborator for monthly invoice (monthly-based)
router.post('/:projectId/pay-collaborator-monthly', auth_1.authenticate, validation_1.validateProjectId, PaymentController_1.PaymentController.payCollaboratorForMonthlyInvoice);
exports.default = router;
