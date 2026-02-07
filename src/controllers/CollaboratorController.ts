import { Request, Response } from 'express'
import type Stripe from 'stripe'
import { Collaborator } from '../models/Collaborator'
import { User } from '../models/User'
import { Project } from '../models/Project'
import { ApiResponse } from '../views/response'
import { AuthRequest } from '../middleware/auth'
import { getStripe } from '../config/stripe'

export class CollaboratorController {
  // Get all collaborators
  static async getAllCollaborators(req: Request, res: Response) {
    try {
      const collaborators = await Collaborator.find().sort({ created_at: -1 })
      return ApiResponse.success(res, collaborators, 'Collaborators retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get collaborator by ID
  static async getCollaborator(req: Request, res: Response) {
    try {
      const { collaboratorId } = req.params
      const collaborator = await Collaborator.findById(collaboratorId)

      if (!collaborator) {
        return ApiResponse.notFound(res, 'Collaborator not found')
      }

      return ApiResponse.success(res, collaborator, 'Collaborator retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Create new collaborator
  static async createCollaborator(req: Request, res: Response) {
    try {
      const { first_name, last_name, email, password } = req.body

      if (!first_name || !last_name || !email || !password) {
        return ApiResponse.error(res, 'First name, last name, email and password are required', 400)
      }

      // Ensure email is not already used by another user
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return ApiResponse.error(res, 'A user with this email already exists', 400)
      }

      // Create a User record for collaborator login
      const user = await User.create({
        name: `${first_name} ${last_name}`.trim(),
        email: email.toLowerCase(),
        password,
        role: 'collaborator',
      })

      const collaborator = await Collaborator.create({
        first_name,
        last_name,
        email: email.toLowerCase(),
        user_id: user._id,
      })

      return ApiResponse.success(res, collaborator, 'Collaborator created successfully', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Update collaborator
  static async updateCollaborator(req: Request, res: Response) {
    try {
      const { collaboratorId } = req.params
      const { first_name, last_name } = req.body

      if (!first_name || !last_name) {
        return ApiResponse.error(res, 'First name and last name are required', 400)
      }

      const collaborator = await Collaborator.findByIdAndUpdate(
        collaboratorId,
        { first_name, last_name },
        { new: true }
      )

      if (!collaborator) {
        return ApiResponse.notFound(res, 'Collaborator not found')
      }

      return ApiResponse.success(res, collaborator, 'Collaborator updated successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Delete collaborator
  static async deleteCollaborator(req: Request, res: Response) {
    try {
      const { collaboratorId } = req.params

      // Check if collaborator is assigned to any projects
      const projectsWithCollaborator = await Project.find({ assigned_collaborator: collaboratorId })
      
      if (projectsWithCollaborator.length > 0) {
        return ApiResponse.error(
          res,
          `Cannot delete collaborator. They are assigned to ${projectsWithCollaborator.length} project(s). Please unassign them first.`,
          400
        )
      }

      const collaborator = await Collaborator.findByIdAndDelete(collaboratorId)

      if (!collaborator) {
        return ApiResponse.notFound(res, 'Collaborator not found')
      }

      return ApiResponse.success(res, null, 'Collaborator deleted successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get projects assigned to a collaborator
  static async getCollaboratorProjects(req: Request, res: Response) {
    try {
      const { collaboratorId } = req.params

      const projects = await Project.find({ assigned_collaborator: collaboratorId })
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Collaborator projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get projects for the currently authenticated collaborator
  static async getMyProjects(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      const projects = await Project.find({ assigned_collaborator: collaborator._id })
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Collaborator projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Create or refresh a Stripe Connect onboarding link for the current collaborator
  static async createStripeConnectLink(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      const stripe = getStripe()

      let accountId = collaborator.stripe_account_id

      // Create a new Stripe Connect account if one does not exist
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email: collaborator.email,
          capabilities: {
            transfers: { requested: true },
          },
        } as any)

        accountId = account.id
        collaborator.stripe_account_id = accountId
        await collaborator.save()
      }

      const LOCAL_FRONTEND = 'http://localhost:5173'
      const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app'
      const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND
      const refreshUrl = `${FRONTEND_URL}/collaborator/stripe/refresh`
      const returnUrl = `${FRONTEND_URL}/collaborator/stripe/return`

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      })

      return ApiResponse.success(res, { url: accountLink.url }, 'Stripe onboarding link created')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get Stripe Connect status for the current collaborator
  static async getStripeStatus(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      if (!collaborator.stripe_account_id) {
        return ApiResponse.success(
          res,
          {
            connected: false,
            payouts_enabled: false,
          },
          'Stripe not connected'
        )
      }

      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(collaborator.stripe_account_id)

      const payoutsEnabled = (account as any).payouts_enabled ?? false

      if (collaborator.payouts_enabled !== payoutsEnabled) {
        collaborator.payouts_enabled = payoutsEnabled
        await collaborator.save()
      }

      // Get balance from connected account
      let balance: { available: Stripe.Balance.Available[]; pending: Stripe.Balance.Pending[] } | null = null
      try {
        const accountBalance = await stripe.balance.retrieve({
          stripeAccount: collaborator.stripe_account_id,
        })
        
        // Log balance for debugging
        console.log('Connected account balance:', JSON.stringify({
          available: accountBalance.available,
          pending: accountBalance.pending,
          accountId: collaborator.stripe_account_id,
        }))
        
        balance = {
          available: accountBalance.available || [],
          pending: accountBalance.pending || [],
        }
      } catch (balanceError: any) {
        // Balance retrieval might fail if account is not fully set up, that's okay
        console.warn('Could not retrieve balance for connected account:', balanceError.message)
        console.warn('Balance error details:', {
          code: balanceError.code,
          type: balanceError.type,
          accountId: collaborator.stripe_account_id,
        })
      }

      return ApiResponse.success(
        res,
        {
          connected: true,
          payouts_enabled: payoutsEnabled,
          invoice_type: collaborator.invoice_type || 'per-project',
          balance: balance,
        },
        'Stripe status retrieved'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Update invoice type preference
  static async updateInvoiceType(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const { invoice_type } = req.body

      if (!invoice_type || !['per-project', 'monthly'].includes(invoice_type)) {
        return ApiResponse.error(res, 'Invalid invoice type. Must be "per-project" or "monthly"', 400)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      collaborator.invoice_type = invoice_type
      await collaborator.save()

      return ApiResponse.success(res, collaborator, 'Invoice type updated successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Disconnect Stripe account for the current collaborator
  static async disconnectStripe(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      if (!collaborator.stripe_account_id) {
        return ApiResponse.error(res, 'No Stripe account connected', 400)
      }

      // Clear Stripe account information from collaborator
      collaborator.stripe_account_id = undefined
      collaborator.payouts_enabled = false
      collaborator.charges_enabled = false
      await collaborator.save()

      return ApiResponse.success(
        res,
        {
          connected: false,
          payouts_enabled: false,
        },
        'Stripe account disconnected successfully'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get monthly invoice projects (completed projects in a specific month that need invoice)
  static async getMonthlyInvoiceProjects(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }

      const collaborator = await Collaborator.findOne({ user_id: userId })

      if (!collaborator) {
        return ApiResponse.error(res, 'Collaborator profile not found', 404)
      }

      const { month } = req.query // Format: "YYYY-MM" (e.g., "2024-01")

      if (!month || typeof month !== 'string') {
        return ApiResponse.error(res, 'Month parameter is required (format: YYYY-MM)', 400)
      }

      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return ApiResponse.error(res, 'Invalid month format. Use YYYY-MM (e.g., 2024-01)', 400)
      }

      // Find all completed projects for this collaborator in the specified month
      // that don't have a monthly invoice yet, or have a rejected monthly invoice for this month
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999)

      // Build query - use completed_at if available, otherwise fall back to updated_at
      // Include projects with rejected monthly invoices for this month (to allow re-upload)
      const projects = await Project.find({
        assigned_collaborator: collaborator._id,
        status: 'completed',
        payment_status: 'paid',
        $and: [
          {
            $or: [
              // If completed_at exists and is in the month range, use it
              { completed_at: { $gte: startDate, $lte: endDate } },
              // Otherwise, if completed_at doesn't exist, use updated_at
              {
                $and: [
                  { completed_at: { $exists: false } },
                  { updated_at: { $gte: startDate, $lte: endDate } }
                ]
              }
            ]
          },
          {
            $or: [
              // No monthly invoice yet
              { monthly_invoice_id: { $exists: false } },
              { monthly_invoice_id: null },
              // Different month
              { monthly_invoice_month: { $ne: month } },
              // Rejected invoice for this month (allow re-upload)
              {
                $and: [
                  { monthly_invoice_month: month },
                  { invoice_status: 'rejected' }
                ]
              }
            ]
          }
        ]
      })
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ completed_at: -1, updated_at: -1 })

      // Calculate total amount
      const totalAmount = projects.reduce((sum, project) => {
        return sum + (project.collaborator_payment_amount || 0)
      }, 0)

      return ApiResponse.success(
        res,
        {
          month,
          projects,
          total_amount: totalAmount,
          project_count: projects.length,
        },
        'Monthly invoice projects retrieved successfully'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get payment summary for all collaborators (admin only)
  static async getPaymentSummary(req: Request, res: Response) {
    try {
      const collaborators = await Collaborator.find().sort({ created_at: -1 })
      
      // Get payment summary for each collaborator
      const paymentSummary = await Promise.all(
        collaborators.map(async (collaborator) => {
          // Find all projects where this collaborator has been paid
          const paidProjects = await Project.find({
            assigned_collaborator: collaborator._id,
            collaborator_paid: true,
          })

          // Calculate total amount paid
          const totalPaid = paidProjects.reduce((sum, project) => {
            return sum + (project.collaborator_payment_amount || 0)
          }, 0)

          // Count number of payments (both individual and monthly)
          const paymentCount = paidProjects.length

          // Get list of unique transfer IDs to count actual payment transactions
          const uniqueTransfers = new Set(
            paidProjects
              .filter(p => p.collaborator_transfer_id)
              .map(p => p.collaborator_transfer_id)
          )
          const transactionCount = uniqueTransfers.size

          return {
            collaborator_id: collaborator._id,
            collaborator_name: `${collaborator.first_name} ${collaborator.last_name}`,
            collaborator_email: collaborator.email,
            total_paid: totalPaid,
            payment_count: paymentCount,
            transaction_count: transactionCount,
          }
        })
      )

      return ApiResponse.success(
        res,
        paymentSummary,
        'Payment summary retrieved successfully'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}



