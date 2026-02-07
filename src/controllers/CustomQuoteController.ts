import { Request, Response } from 'express'
import { CustomQuote } from '../models/CustomQuote'
import { Project } from '../models/Project'
import { ApiResponse } from '../views/response'
import type { AuthRequest } from '../middleware/auth'

export class CustomQuoteController {
  // Request a custom quote (client)
  static async requestCustomQuote(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const { projectId } = req.params
      const { description, estimated_budget, preferred_timeline } = req.body
      const userId = authReq.user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      // Verify project exists
      const project = await Project.findById(projectId)
      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Check if project is custom type
      if (project.project_type !== 'custom') {
        return ApiResponse.error(res, 'This project is not a custom project', 400)
      }

      // Check if quote already exists
      const existingQuote = await CustomQuote.findOne({ project_id: projectId })
      if (existingQuote) {
        return ApiResponse.error(res, 'Custom quote already requested for this project', 400)
      }

      // Create custom quote request
      const customQuote = await CustomQuote.create({
        project_id: projectId,
        requested_by: userId,
        delivery_timeline: preferred_timeline || '30 days',
        status: 'pending',
        admin_notes: description || '',
      })

      // Link quote to project
      await Project.findByIdAndUpdate(projectId, {
        custom_quote_request: customQuote._id,
      })

      return ApiResponse.success(res, customQuote, 'Custom quote requested successfully', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get custom quote for a project
  static async getCustomQuote(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const customQuote = await CustomQuote.findOne({ project_id: projectId })
        .populate('requested_by', 'name email')
        .populate('project_id', 'name client_name')

      if (!customQuote) {
        return ApiResponse.notFound(res, 'Custom quote not found')
      }

      return ApiResponse.success(res, customQuote)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Send custom quote (admin)
  static async sendCustomQuote(req: Request, res: Response) {
    try {
      const { quoteId } = req.params
      const { amount, delivery_timeline, admin_notes } = req.body

      if (!amount) {
        return ApiResponse.error(res, 'Amount is required', 400)
      }

      const customQuote = await CustomQuote.findById(quoteId)
      if (!customQuote) {
        return ApiResponse.notFound(res, 'Custom quote not found')
      }

      // Update quote with admin details
      customQuote.amount = parseFloat(amount.toString().replace('$', '').replace(',', ''))
      customQuote.delivery_timeline = delivery_timeline || customQuote.delivery_timeline || '30 days'
      customQuote.admin_notes = admin_notes || customQuote.admin_notes
      customQuote.status = 'sent'
      customQuote.sent_at = new Date()
      await customQuote.save()

      // Update project with quote amount
      await Project.findByIdAndUpdate(customQuote.project_id, {
        custom_quote_amount: customQuote.amount,
        delivery_timeline: customQuote.delivery_timeline,
      })

      return ApiResponse.success(res, customQuote, 'Custom quote sent successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Accept custom quote (client)
  static async acceptCustomQuote(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const { quoteId } = req.params
      const userId = authReq.user?.userId
      const userEmail = authReq.user?.email

      if (!userId || !userEmail) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      const customQuote = await CustomQuote.findById(quoteId)
      if (!customQuote) {
        return ApiResponse.notFound(res, 'Custom quote not found')
      }

      if (customQuote.status !== 'sent') {
        return ApiResponse.error(res, 'Quote has not been sent yet', 400)
      }

      // Verify user owns this quote - check by userId or email
      if (customQuote.requested_by) {
        if (customQuote.requested_by.toString() !== userId) {
          return ApiResponse.error(res, 'Unauthorized', 403)
        }
      } else if (customQuote.client_email) {
        if (customQuote.client_email !== userEmail) {
          return ApiResponse.error(res, 'Unauthorized', 403)
        }
      } else {
        return ApiResponse.error(res, 'Quote has no associated user', 400)
      }

      // Accept quote
      customQuote.status = 'accepted'
      customQuote.accepted_at = new Date()
      await customQuote.save()

      // Update project if it exists
      if (customQuote.project_id) {
        await Project.findByIdAndUpdate(customQuote.project_id, {
          custom_quote_amount: customQuote.amount,
          delivery_timeline: customQuote.delivery_timeline,
        })
      }

      return ApiResponse.success(res, customQuote, 'Custom quote accepted successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Request a standalone custom quote (from client dashboard, no project required)
  static async requestStandaloneQuote(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const { description, estimated_budget, preferred_timeline } = req.body
      const userId = authReq.user?.userId
      const userEmail = authReq.user?.email

      if (!userId || !userEmail) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      // Create standalone custom quote request
      const customQuote = await CustomQuote.create({
        requested_by: userId,
        client_email: userEmail,
        description: description || '',
        estimated_budget: estimated_budget ? parseFloat(estimated_budget.toString().replace('$', '').replace(',', '')) : undefined,
        delivery_timeline: preferred_timeline || '30 days',
        status: 'pending',
      })

      return ApiResponse.success(res, customQuote, 'Custom quote requested successfully', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Create custom project from quote request (admin)
  static async createProjectFromQuote(req: Request, res: Response) {
    try {
      const { quoteId } = req.params
      const { name, amount, delivery_timeline, deadline, custom_quote_description } = req.body

      if (!name || !amount) {
        return ApiResponse.error(res, 'Project name and amount are required', 400)
      }

      const customQuote = await CustomQuote.findById(quoteId)
      if (!customQuote) {
        return ApiResponse.notFound(res, 'Custom quote not found')
      }

      if (customQuote.status !== 'pending') {
        return ApiResponse.error(res, 'Quote has already been processed', 400)
      }

      let clientEmail = customQuote.client_email
      
      // If no client_email, get it from the user
      if (!clientEmail && customQuote.requested_by) {
        const { User } = await import('../models/User')
        const user = await User.findById(customQuote.requested_by)
        if (user) {
          clientEmail = user.email
        }
      }
      
      if (!clientEmail) {
        return ApiResponse.error(res, 'Client email not found', 400)
      }

      // Create custom project
      const projectData: any = {
        name,
        client_name: 'Client',
        client_email: clientEmail,
        project_type: 'custom',
        status: 'pending',
        payment_status: 'pending',
        custom_quote_amount: parseFloat(amount.toString().replace('$', '').replace(',', '')),
        custom_quote_description: custom_quote_description || undefined,
        delivery_timeline: delivery_timeline || customQuote.delivery_timeline || '30 days',
      }

      if (deadline) {
        projectData.deadline = new Date(deadline)
      }

      // Link user if available
      if (customQuote.requested_by) {
        projectData.client_user = customQuote.requested_by
      }

      const project = await Project.create(projectData)

      // Update quote with project and mark as sent
      customQuote.project_id = project._id
      customQuote.amount = projectData.custom_quote_amount
      customQuote.delivery_timeline = projectData.delivery_timeline
      customQuote.status = 'sent'
      customQuote.sent_at = new Date()
      await customQuote.save()

      // Link quote to project
      await Project.findByIdAndUpdate(project._id, {
        custom_quote_request: customQuote._id,
      })

      return ApiResponse.success(res, { project, quote: customQuote }, 'Custom project created successfully', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all pending custom quotes (admin)
  static async getAllPendingQuotes(req: Request, res: Response) {
    try {
      const quotes = await CustomQuote.find({ status: 'pending' })
        .populate('project_id', 'name client_name client_email')
        .populate('requested_by', 'name email')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, quotes)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}


