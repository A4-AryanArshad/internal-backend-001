import { Request, Response } from 'express'
import { Project } from '../models/Project'
import { Service } from '../models/Service'
import { getStripe } from '../config/stripe'
import { ApiResponse } from '../views/response'
import { AuthRequest } from '../middleware/auth'
import { Collaborator } from '../models/Collaborator'

export class PaymentController {
  // Create Stripe checkout session
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { serviceId, customAmount } = req.body

      // Verify project exists
      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Determine amount
      let amount = 0
      let description = ''

      if (serviceId) {
        const service = await Service.findById(serviceId)

        if (!service) {
          return ApiResponse.notFound(res, 'Service not found')
        }

        amount = service.price
        description = service.name
      } else if (customAmount) {
        amount = customAmount
        description = 'Custom Quote'
      } else {
        return ApiResponse.error(res, 'No service or amount specified', 400)
      }

      // Create Stripe checkout session
      const stripe = getStripe()
      const LOCAL_FRONTEND = 'http://localhost:5173'
      const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app'
      const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description,
                description: `Project: ${project.name}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: project.client_email || undefined, // Pre-fill email if available
        billing_address_collection: 'required', // Collect billing address (includes email)
        success_url: `${FRONTEND_URL}/client/${projectId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/client/${projectId}/payment?payment=cancelled`,
        metadata: {
          projectId: projectId,
          serviceId: serviceId || '',
          customAmount: customAmount?.toString() || '',
        },
      })

      return ApiResponse.success(res, {
        sessionId: session.id,
        url: session.url,
      }, 'Checkout session created')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Handle Stripe webhook
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string
    // Hardcoded webhook secret (update this with your actual Stripe webhook secret)
    const webhookSecret = '' // Add your Stripe webhook secret here

    if (!webhookSecret) {
      return ApiResponse.error(res, 'Webhook secret not configured', 500)
    }

    let event

    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err: any) {
      return ApiResponse.error(res, `Webhook signature verification failed: ${err.message}`, 400)
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      // Update project payment status
      const updateData: any = {
        payment_status: 'paid',
        stripe_payment_id: session.id,
      }

      if (session.metadata.serviceId) {
        updateData.selected_service = session.metadata.serviceId
      } else if (session.metadata.customAmount) {
        updateData.custom_quote_amount = parseFloat(session.metadata.customAmount)
      }

      const project = await Project.findByIdAndUpdate(session.metadata.projectId, updateData)

      // Send email to client with dashboard link (or log to console in dev)
      if (project) {
        const { sendClientDashboardEmail } = await import('../services/emailService')
        await sendClientDashboardEmail(
          project.client_email || 'no-email@example.com',
          project.client_name,
          project._id.toString(),
          project.name
        )
      }
    }

    return res.json({ received: true })
  }

  // Manually verify payment status from Stripe (for testing/development)
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      // Get project
      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // If project already has stripe_payment_id, check status
      if (project.stripe_payment_id) {
        const stripe = getStripe()
        const session = await stripe.checkout.sessions.retrieve(project.stripe_payment_id)

        if (session.payment_status === 'paid') {
          // Update payment status
          await Project.findByIdAndUpdate(projectId, {
            payment_status: 'paid',
          })

          return ApiResponse.success(res, {
            payment_status: 'paid',
            verified: true,
            message: 'Payment verified and updated',
          })
        } else {
          return ApiResponse.success(res, {
            payment_status: session.payment_status,
            verified: false,
            message: `Payment status: ${session.payment_status}`,
          })
        }
      }

      return ApiResponse.error(res, 'No payment ID found for this project', 400)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Handle payment success (called from frontend after Stripe redirect)
  static async handlePaymentSuccess(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { session_id } = req.query

      if (!session_id) {
        return ApiResponse.error(res, 'Session ID is required', 400)
      }

      // Get project
      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Retrieve Stripe session to get payment details and customer email
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(session_id as string)

      // Check if payment was successful
      if (session.payment_status !== 'paid') {
        return ApiResponse.error(res, 'Payment not completed', 400)
      }

      // Get customer email from Stripe session (Stripe collects this during checkout)
      const customerEmail = session.customer_email || session.customer_details?.email

      // Update project with payment status and email
      const updateData: any = {
        payment_status: 'paid',
        stripe_payment_id: session.id,
      }

      // Update client email if we got it from Stripe and project doesn't have one
      if (customerEmail && !project.client_email) {
        updateData.client_email = customerEmail
      }

      // Update service selection if in metadata
      if (session.metadata?.serviceId) {
        updateData.selected_service = session.metadata.serviceId
      } else if (session.metadata?.customAmount) {
        updateData.custom_quote_amount = parseFloat(session.metadata.customAmount)
      }

      const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true })

      if (!updatedProject) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Determine which email to use (prefer Stripe email, fallback to project email)
      const emailToUse = customerEmail || updatedProject.client_email

      // Send email to client with dashboard link
      if (emailToUse) {
        const { sendClientDashboardEmail } = await import('../services/emailService')
        const emailResult = await sendClientDashboardEmail(
          emailToUse,
          updatedProject.client_name,
          updatedProject._id.toString(),
          updatedProject.name
        )

        return ApiResponse.success(res, {
          project: updatedProject,
          email_sent: emailResult.success,
          email_address: emailToUse,
        }, 'Payment confirmed and email sent')
      } else {
        console.warn('⚠️  No email address available to send dashboard link')
        return ApiResponse.success(res, {
          project: updatedProject,
          email_sent: false,
          message: 'Payment confirmed but no email address available',
        }, 'Payment confirmed')
      }
    } catch (error: any) {
      console.error('❌ Payment success handler error:', error)
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Manually mark payment as paid (for testing/development)
  static async markAsPaid(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { stripe_payment_id } = req.body

      const project = await Project.findByIdAndUpdate(
        projectId,
        {
          payment_status: 'paid',
          stripe_payment_id: stripe_payment_id || `manual_${Date.now()}`,
        },
        { new: true }
      )

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Send email to client if email exists
      if (project.client_email) {
        const { sendClientDashboardEmail } = await import('../services/emailService')
        await sendClientDashboardEmail(
          project.client_email,
          project.client_name,
          project._id.toString(),
          project.name
        )
      }

      return ApiResponse.success(res, project, 'Payment status updated to paid')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Collaborator claims earnings for a completed, paid project
  static async claimCollaboratorEarnings(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId
      const { projectId } = req.params

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      if (!project.assigned_collaborator || project.assigned_collaborator.toString() !== collaborator._id.toString()) {
        return ApiResponse.error(res, 'You are not assigned to this project', 403)
      }

      if (project.payment_status !== 'paid') {
        return ApiResponse.error(res, 'Client payment must be completed before claiming earnings', 400)
      }

      if (project.status !== 'completed') {
        return ApiResponse.error(res, 'Project must be marked as completed before claiming earnings', 400)
      }

      if (project.collaborator_paid) {
        return ApiResponse.error(res, 'Earnings for this project have already been paid out', 400)
      }

      if (!project.collaborator_payment_amount || project.collaborator_payment_amount <= 0) {
        return ApiResponse.error(res, 'Collaborator payment amount is not set for this project', 400)
      }

      if (!collaborator.stripe_account_id || !collaborator.payouts_enabled) {
        return ApiResponse.error(res, 'Stripe account is not ready for payouts', 400)
      }

      const stripe = getStripe()

      const amountInCents = Math.round(project.collaborator_payment_amount * 100)

      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: collaborator.stripe_account_id,
        description: `Payout for project ${project.name}`,
        metadata: {
          projectId: project._id.toString(),
          collaboratorId: collaborator._id.toString(),
        },
      })

      project.collaborator_paid = true
      project.collaborator_paid_at = new Date()
      project.collaborator_transfer_id = transfer.id
      await project.save()

      return ApiResponse.success(
        res,
        {
          transfer_id: transfer.id,
          amount: project.collaborator_payment_amount,
        },
        'Collaborator earnings paid out successfully'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Admin pays collaborator for a single project invoice (project-based payment)
  static async payCollaboratorForProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await Project.findById(projectId).populate('assigned_collaborator')

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      if (!project.assigned_collaborator) {
        return ApiResponse.error(res, 'No collaborator assigned to this project', 400)
      }

      const collaborator = await Collaborator.findById(project.assigned_collaborator)

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator not found', 404)
      }

      if (!collaborator.stripe_account_id) {
        return ApiResponse.error(res, 'Collaborator has not connected their Stripe account', 400)
      }

      // Check if Stripe account is ready for payouts
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(collaborator.stripe_account_id)

      if (!account.payouts_enabled || !account.charges_enabled) {
        return ApiResponse.error(res, 'Collaborator\'s Stripe account is not fully set up for payouts', 400)
      }

      if (project.invoice_status !== 'approved') {
        return ApiResponse.error(res, 'Invoice must be approved before payment', 400)
      }

      if (project.collaborator_paid) {
        return ApiResponse.error(res, 'Collaborator has already been paid for this project', 400)
      }

      if (!project.collaborator_payment_amount || project.collaborator_payment_amount <= 0) {
        return ApiResponse.error(res, 'Collaborator payment amount is not set for this project', 400)
      }

      // Check available balance
      const balance = await stripe.balance.retrieve()
      const availableBalances = balance.available || []
      
      // Try to find USD balance first, then any available balance
      let availableBalance = availableBalances.find((b: any) => b.currency === 'usd')
      if (!availableBalance && availableBalances.length > 0) {
        availableBalance = availableBalances[0] // Use first available currency
      }
      
      const accountCurrency = availableBalance?.currency || 'usd'
      const requiredAmount = Math.round(project.collaborator_payment_amount * 100)
      
      if (!availableBalance || availableBalance.amount < requiredAmount) {
        const availableAmount = availableBalance ? (availableBalance.amount / 100).toFixed(2) : '0.00'
        return ApiResponse.error(
          res,
          `Insufficient ${accountCurrency.toUpperCase()} balance. Available: ${availableAmount} ${accountCurrency.toUpperCase()}, Required: ${project.collaborator_payment_amount} ${accountCurrency.toUpperCase()}. In test mode, add funds using test card 4000000000000077.`,
          402
        )
      }

      const amountInCents = Math.round(project.collaborator_payment_amount * 100)

      let transfer
      try {
        transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: accountCurrency.toLowerCase(),
          destination: collaborator.stripe_account_id,
          description: `Payment for project: ${project.name}`,
          metadata: {
            projectId: project._id.toString(),
            collaboratorId: collaborator._id.toString(),
            paymentType: 'per-project',
          },
        })
        
        // Log transfer details for debugging
        console.log('Transfer created:', {
          transferId: transfer.id,
          amount: amountInCents,
          currency: accountCurrency.toLowerCase(),
          destination: collaborator.stripe_account_id,
          status: (transfer as any).status,
        })
      } catch (transferError: any) {
        // Handle insufficient funds error with helpful message
        if (transferError.code === 'insufficient_funds' || transferError.message?.includes('insufficient')) {
          return ApiResponse.error(
            res,
            'Insufficient funds in your Stripe account. In test mode, add funds using test card 4000000000000077. See: https://stripe.com/docs/testing#available-balance',
            402
          )
        }
        throw transferError
      }

      project.collaborator_paid = true
      project.collaborator_paid_at = new Date()
      project.collaborator_transfer_id = transfer.id
      await project.save()

      return ApiResponse.success(
        res,
        {
          transfer_id: transfer.id,
          amount: project.collaborator_payment_amount,
          project_name: project.name,
          collaborator_name: `${collaborator.first_name} ${collaborator.last_name}`,
        },
        'Collaborator paid successfully'
      )
    } catch (error: any) {
      // Return more user-friendly error messages
      if (error.code === 'insufficient_funds' || error.message?.includes('insufficient')) {
        return ApiResponse.error(
          res,
          'Insufficient funds in your Stripe account. In test mode, add funds using test card 4000000000000077. See: https://stripe.com/docs/testing#available-balance',
          402
        )
      }
      return ApiResponse.error(res, error.message || 'Failed to process payment', 500)
    }
  }

  // Admin pays collaborator for monthly invoice (monthly-based payment)
  static async payCollaboratorForMonthlyInvoice(req: Request, res: Response) {
    try {
      const { projectId } = req.params // Use any project ID from the monthly invoice group

      const project = await Project.findById(projectId).populate('assigned_collaborator')

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      if (!project.monthly_invoice_id) {
        return ApiResponse.error(res, 'This project is not part of a monthly invoice', 400)
      }

      if (!project.assigned_collaborator) {
        return ApiResponse.error(res, 'No collaborator assigned to this project', 400)
      }

      const collaborator = await Collaborator.findById(project.assigned_collaborator)

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator not found', 404)
      }

      if (!collaborator.stripe_account_id) {
        return ApiResponse.error(res, 'Collaborator has not connected their Stripe account', 400)
      }

      // Check if Stripe account is ready for payouts
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(collaborator.stripe_account_id)

      if (!account.payouts_enabled || !account.charges_enabled) {
        return ApiResponse.error(res, 'Collaborator\'s Stripe account is not fully set up for payouts', 400)
      }

      if (project.invoice_status !== 'approved') {
        return ApiResponse.error(res, 'Monthly invoice must be approved before payment', 400)
      }

      // Get all projects in this monthly invoice
      const monthlyProjects = await Project.find({
        monthly_invoice_id: project.monthly_invoice_id,
      })

      if (monthlyProjects.length === 0) {
        return ApiResponse.error(res, 'No projects found for this monthly invoice', 400)
      }

      // Check if any project in the group has already been paid
      const alreadyPaid = monthlyProjects.some(p => p.collaborator_paid)
      if (alreadyPaid) {
        return ApiResponse.error(res, 'Some projects in this monthly invoice have already been paid', 400)
      }

      // Calculate total amount for all projects in the monthly invoice
      const totalAmount = monthlyProjects.reduce((sum, p) => {
        return sum + (p.collaborator_payment_amount || 0)
      }, 0)

      if (totalAmount <= 0) {
        return ApiResponse.error(res, 'Total payment amount is invalid', 400)
      }

      // Check available balance
      const balance = await stripe.balance.retrieve()
      const availableBalances = balance.available || []
      
      // Try to find USD balance first, then any available balance
      let availableBalance = availableBalances.find((b: any) => b.currency === 'usd')
      if (!availableBalance && availableBalances.length > 0) {
        availableBalance = availableBalances[0] // Use first available currency
      }
      
      const accountCurrency = availableBalance?.currency || 'usd'
      const requiredAmount = Math.round(totalAmount * 100)
      
      if (!availableBalance || availableBalance.amount < requiredAmount) {
        const availableAmount = availableBalance ? (availableBalance.amount / 100).toFixed(2) : '0.00'
        return ApiResponse.error(
          res,
          `Insufficient ${accountCurrency.toUpperCase()} balance. Available: ${availableAmount} ${accountCurrency.toUpperCase()}, Required: ${totalAmount} ${accountCurrency.toUpperCase()}. In test mode, add funds using test card 4000000000000077.`,
          402
        )
      }

      const amountInCents = Math.round(totalAmount * 100)

      let transfer
      try {
        transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: accountCurrency.toLowerCase(),
          destination: collaborator.stripe_account_id,
          description: `Monthly invoice payment for ${project.monthly_invoice_month || 'unknown month'}`,
          metadata: {
            monthly_invoice_id: project.monthly_invoice_id,
            collaboratorId: collaborator._id.toString(),
            paymentType: 'monthly',
            project_count: monthlyProjects.length.toString(),
          },
        })
      } catch (transferError: any) {
        // Handle insufficient funds error with helpful message
        if (transferError.code === 'insufficient_funds' || transferError.message?.includes('insufficient')) {
          return ApiResponse.error(
            res,
            'Insufficient funds in your Stripe account. In test mode, add funds using test card 4000000000000077. See: https://stripe.com/docs/testing#available-balance',
            402
          )
        }
        throw transferError
      }

      // Mark all projects in the monthly invoice as paid
      await Project.updateMany(
        { monthly_invoice_id: project.monthly_invoice_id },
        {
          collaborator_paid: true,
          collaborator_paid_at: new Date(),
          collaborator_transfer_id: transfer.id,
        }
      )

      return ApiResponse.success(
        res,
        {
          transfer_id: transfer.id,
          amount: totalAmount,
          project_count: monthlyProjects.length,
          month: project.monthly_invoice_month,
          collaborator_name: `${collaborator.first_name} ${collaborator.last_name}`,
        },
        'Monthly invoice paid successfully'
      )
    } catch (error: any) {
      // Return more user-friendly error messages
      if (error.code === 'insufficient_funds' || error.message?.includes('insufficient')) {
        return ApiResponse.error(
          res,
          'Insufficient funds in your Stripe account. In test mode, add funds using test card 4000000000000077. See: https://stripe.com/docs/testing#available-balance',
          402
        )
      }
      return ApiResponse.error(res, error.message || 'Failed to process payment', 500)
    }
  }
}
