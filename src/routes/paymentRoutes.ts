import { Router } from 'express'
import { PaymentController } from '../controllers/PaymentController'
import { validateProjectId } from '../middleware/validation'
import express from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

// Create Stripe checkout session
router.post('/:projectId/checkout', validateProjectId, PaymentController.createCheckoutSession)

// Stripe webhook (must use raw body)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
)

// Manually verify payment status (for testing/development)
router.get('/:projectId/verify', validateProjectId, PaymentController.verifyPayment)

// Handle payment success (called from frontend after Stripe redirect)
router.get('/:projectId/success', validateProjectId, PaymentController.handlePaymentSuccess)

// Collaborator claims earnings for a completed project
router.post(
  '/:projectId/claim-earnings',
  authenticate,
  validateProjectId,
  PaymentController.claimCollaboratorEarnings
)

// Manually mark payment as paid (for testing/development)
router.post('/:projectId/mark-paid', validateProjectId, PaymentController.markAsPaid)

// Admin pays collaborator for a project invoice (project-based)
router.post(
  '/:projectId/pay-collaborator',
  authenticate,
  validateProjectId,
  PaymentController.payCollaboratorForProject
)

// Admin pays collaborator for monthly invoice (monthly-based)
router.post(
  '/:projectId/pay-collaborator-monthly',
  authenticate,
  validateProjectId,
  PaymentController.payCollaboratorForMonthlyInvoice
)

export default router

