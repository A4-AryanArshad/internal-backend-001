import { Request, Response } from 'express'
import { Project } from '../models/Project'
import { ApiResponse } from '../views/response'
import { AuthRequest } from '../middleware/auth'

export class ProjectController {
  // Get project by ID (for client link validation)
  static async getProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found or invalid link')
      }

      return ApiResponse.success(res, project, 'Project retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Update project service selection
  static async updateServiceSelection(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { serviceId, customAmount } = req.body

      // Verify project exists
      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Update project with service selection
      const updateData: any = {}

      if (serviceId) {
        updateData.selected_service = serviceId
      } else if (customAmount) {
        updateData.custom_quote_amount = customAmount
      }

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        updateData,
        { new: true }
      )

      return ApiResponse.success(res, updatedProject, 'Service selection updated')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get project with full details (for client dashboard)
  static async getProjectDetails(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      // Get project with populated service, collaborator, and custom quote request
      const project = await Project.findById(projectId)
        .populate('selected_service')
        .populate('assigned_collaborator', 'first_name last_name')
        .populate('custom_quote_request', 'description')

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Get briefing
      const { ProjectBriefing } = await import('../models/Briefing')
      const briefing = await ProjectBriefing.findOne({ project_id: projectId })

      // Get briefing images
      const { BriefingImage } = await import('../models/Briefing')
      const images = await BriefingImage.find({ project_id: projectId }).sort({ order: 1 })

      // Format images for response
      const formattedImages = images.map((img: any) => ({
        _id: img._id,
        id: img._id,
        url: img.image_url,
        notes: img.notes,
        order: img.order,
      }))

      return ApiResponse.success(res, {
        project,
        briefing: briefing || null,
        images: formattedImages || [],
      })
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Create new project (admin)
  static async createProject(req: Request, res: Response) {
    try {
      const { name, client_name, client_email, project_type, service, service_price, amount, deadline } = req.body

      if (!name) {
        return ApiResponse.error(res, 'Project name is required', 400)
      }

      const projectData: any = {
        name,
        client_name: client_name || 'Client', // Default client name if not provided
        client_email: client_email || undefined,
        project_type: project_type || 'simple', // 'simple' or 'custom'
        status: 'pending',
        payment_status: 'pending',
      }

      // Handle service selection for simple projects
      if (project_type === 'simple' && service && service !== 'Custom Service') {
        // Store the service name and price directly (no need to link to Service model)
        // Simple projects are accessible to anyone via link
        projectData.service_name = service
        projectData.delivery_timeline = '30 days' // Default delivery timeline
        
        // Parse and store the service price
        if (service_price) {
          const price = parseFloat(service_price.toString().replace('$', '').replace(',', '').trim())
          if (!isNaN(price)) {
            projectData.service_price = price
          }
        }
      } else if (project_type === 'custom' || (service === 'Custom Service' && amount)) {
        // Custom project - set default delivery timeline
        projectData.project_type = 'custom'
        projectData.delivery_timeline = '30 days' // Default, admin can adjust
        if (amount) {
          projectData.custom_quote_amount = parseFloat(amount.toString().replace('$', '').replace(',', ''))
        }
      }

      if (deadline) {
        projectData.deadline = new Date(deadline)
      }

      const project = await Project.create(projectData)

      return ApiResponse.success(res, project, 'Project created successfully', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all projects (admin)
  static async getAllProjects(req: Request, res: Response) {
    try {
      const projects = await Project.find()
        .populate('selected_service')
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all projects for a specific client (by email)
  static async getClientProjects(req: Request, res: Response) {
    try {
      const { email } = req.params

      if (!email) {
        return ApiResponse.error(res, 'Client email is required', 400)
      }

      const projects = await Project.find({ client_email: email })
        .populate('selected_service')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Client projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all predefined (simple) projects for the catalog – same filter as admin "Simple Project (Predefined Services)"
  // Include: project_type === 'simple' OR projects that look like predefined packages (service_name + service_price)
  static async getSimpleProjects(req: Request, res: Response) {
    try {
      const projects = await Project.find({
        $or: [
          { project_type: 'simple' },
          {
            project_type: { $ne: 'custom' },
            service_name: { $exists: true, $ne: '' },
            service_price: { $exists: true, $gt: 0 },
          },
        ],
      })
        .populate('selected_service')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Simple projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all projects for authenticated client (uses JWT token) – paid and unpaid
  static async getMyProjects(req: Request, res: Response) {
    try {
      const userEmail = (req as any).user?.email
      const userId = (req as any).user?.userId

      if (!userEmail) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      const query: any = { $or: [{ client_email: userEmail }] }
      if (userId) {
        query.$or.push({ client_user: userId })
      }

      const projects = await Project.find(query)
        .populate('selected_service')
        .sort({ created_at: -1 })

      return ApiResponse.success(res, projects, 'Your projects retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Duplicate a project for the current user (so each purchase gets its own project row in admin)
  static async duplicateForCurrentUser(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const authReq = req as AuthRequest
      const userEmail = authReq.user?.email
      const userId = authReq.user?.userId

      if (!userEmail) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      const project = await Project.findById(projectId)
      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      const isOwn =
        (project.client_email && project.client_email.toLowerCase() === userEmail.toLowerCase()) ||
        (userId && project.client_user && String(project.client_user) === String(userId))
      if (isOwn) {
        return ApiResponse.error(res, 'This is already your project', 400)
      }

      const doc = project.toObject()
      delete (doc as any)._id
      delete (doc as any).created_at
      delete (doc as any).updated_at
      delete (doc as any).client_email
      delete (doc as any).client_user
      delete (doc as any).payment_status
      delete (doc as any).stripe_payment_id
      delete (doc as any).assigned_collaborator
      delete (doc as any).invoice_url
      delete (doc as any).invoice_public_id
      delete (doc as any).invoice_status
      delete (doc as any).invoice_uploaded_at
      delete (doc as any).invoice_approved_at
      delete (doc as any).invoice_type
      delete (doc as any).monthly_invoice_id
      delete (doc as any).monthly_invoice_month
      delete (doc as any).collaborator_paid
      delete (doc as any).collaborator_paid_at
      delete (doc as any).collaborator_transfer_id
      delete (doc as any).revisions_used
      delete (doc as any).completed_at

      const newProject = await Project.create({
        ...doc,
        client_name: 'Client',
        client_email: userEmail,
        client_user: userId || undefined,
        payment_status: 'pending',
      })

      return ApiResponse.success(res, { newProjectId: newProject._id }, 'Project duplicated for you', 201)
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  /** Create a duplicate project for a user (for checkout). Optionally copy briefing + images to the new project. Returns the new project. */
  static async createDuplicateForCheckout(
    sourceProjectId: string,
    userEmail: string,
    userId: string | undefined,
    copyBriefingAndImages: boolean
  ): Promise<InstanceType<typeof Project> | null> {
    const project = await Project.findById(sourceProjectId)
    if (!project) return null

    const doc = project.toObject() as any
    delete doc._id
    delete doc.created_at
    delete doc.updated_at
    delete doc.client_email
    delete doc.client_user
    delete doc.payment_status
    delete doc.stripe_payment_id
    delete doc.assigned_collaborator
    delete doc.invoice_url
    delete doc.invoice_public_id
    delete doc.invoice_status
    delete doc.invoice_uploaded_at
    delete doc.invoice_approved_at
    delete doc.invoice_type
    delete doc.monthly_invoice_id
    delete doc.monthly_invoice_month
    delete doc.collaborator_paid
    delete doc.collaborator_paid_at
    delete doc.collaborator_transfer_id
    delete doc.revisions_used
    delete doc.completed_at

    const newProject = await Project.create({
      ...doc,
      client_name: 'Client',
      client_email: userEmail,
      client_user: userId,
      payment_status: 'pending',
    })

    if (copyBriefingAndImages) {
      const { ProjectBriefing, BriefingImage } = await import('../models/Briefing')
      const briefing = await ProjectBriefing.findOne({ project_id: sourceProjectId })
      if (briefing) {
        await ProjectBriefing.create({
          project_id: newProject._id,
          overall_description: briefing.overall_description,
          submitted_at: briefing.submitted_at,
        })
      }
      const images = await BriefingImage.find({ project_id: sourceProjectId }).sort({ order: 1 })
      for (let i = 0; i < images.length; i++) {
        await BriefingImage.create({
          project_id: newProject._id,
          image_url: images[i].image_url,
          notes: images[i].notes,
          order: images[i].order ?? i,
        })
      }
    }

    return newProject
  }

  // Update project status
  static async updateStatus(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { status, notes } = req.body

      if (!status) {
        return ApiResponse.error(res, 'Status is required', 400)
      }

      // Check if project exists
      const project = await Project.findById(projectId)
      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Invoice approval is no longer required for status changes
      // Collaborators can change project status regardless of invoice status

      const update: any = { status, updated_at: new Date() }
      
      // Track when project is completed
      if (status === 'completed' && project.status !== 'completed') {
        update.completed_at = new Date()
      }
      
      if (typeof notes === 'string' && notes.trim().length > 0) {
        // Store note under the specific status key (e.g. status_notes.review)
        update[`status_notes.${status}`] = notes.trim()
      }

      const updatedProject = await Project.findByIdAndUpdate(projectId, update, { new: true })

      if (!updatedProject) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      return ApiResponse.success(res, updatedProject, 'Status updated successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Approve invoice (admin only)
  static async approveInvoice(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      if (!project.invoice_url) {
        return ApiResponse.error(res, 'No invoice uploaded for this project', 400)
      }

      if (project.invoice_status === 'approved') {
        return ApiResponse.error(res, 'Invoice is already approved', 400)
      }

      // If this is a monthly invoice, approve all projects in the same monthly invoice group
      if (project.invoice_type === 'monthly' && project.monthly_invoice_id) {
        const monthlyInvoiceId = project.monthly_invoice_id
        const updateResult = await Project.updateMany(
          { monthly_invoice_id: monthlyInvoiceId },
          {
            invoice_status: 'approved',
            invoice_approved_at: new Date(),
            updated_at: new Date(),
          }
        )

        const updatedProjects = await Project.find({ monthly_invoice_id: monthlyInvoiceId })
          .populate('assigned_collaborator', 'first_name last_name')

        return ApiResponse.success(
          res,
          { projects: updatedProjects, count: updateResult.modifiedCount },
          `Monthly invoice approved successfully for ${updateResult.modifiedCount} project(s)`
        )
      }

      // Regular per-project invoice approval
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        {
          invoice_status: 'approved',
          invoice_approved_at: new Date(),
          updated_at: new Date(),
        },
        { new: true }
      ).populate('assigned_collaborator', 'first_name last_name')

      return ApiResponse.success(res, updatedProject, 'Invoice approved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Reject invoice (admin only) - optional
  static async rejectInvoice(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      if (!project.invoice_url) {
        return ApiResponse.error(res, 'No invoice uploaded for this project', 400)
      }

      // If this is a monthly invoice, reject all projects in the same monthly invoice group
      if (project.invoice_type === 'monthly' && project.monthly_invoice_id) {
        const monthlyInvoiceId = project.monthly_invoice_id
        const updateResult = await Project.updateMany(
          { monthly_invoice_id: monthlyInvoiceId },
          {
            invoice_status: 'rejected',
            updated_at: new Date(),
          }
        )

        const updatedProjects = await Project.find({ monthly_invoice_id: monthlyInvoiceId })
          .populate('assigned_collaborator', 'first_name last_name')

        return ApiResponse.success(
          res,
          { projects: updatedProjects, count: updateResult.modifiedCount },
          `Monthly invoice rejected for ${updateResult.modifiedCount} project(s)`
        )
      }

      // Regular per-project invoice rejection
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        {
          invoice_status: 'rejected',
          updated_at: new Date(),
        },
        { new: true }
      ).populate('assigned_collaborator', 'first_name last_name')

      return ApiResponse.success(res, updatedProject, 'Invoice rejected')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Assign collaborator (only after client has paid)
  static async assignCollaborator(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { collaborator_id, payment_amount } = req.body

      if (!collaborator_id) {
        return ApiResponse.error(res, 'Collaborator ID is required', 400)
      }

      if (!payment_amount || payment_amount <= 0) {
        return ApiResponse.error(res, 'Payment amount is required and must be greater than 0', 400)
      }

      // Require client payment before assigning a collaborator
      const existingProject = await Project.findById(projectId)
      if (!existingProject) {
        return ApiResponse.notFound(res, 'Project not found')
      }
      if (existingProject.payment_status !== 'paid') {
        return ApiResponse.error(
          res,
          'Client must complete payment before you can assign a collaborator.',
          400
        )
      }

      // Verify collaborator exists
      const { Collaborator } = await import('../models/Collaborator')
      const collaborator = await Collaborator.findById(collaborator_id)
      
      if (!collaborator) {
        return ApiResponse.notFound(res, 'Collaborator not found')
      }

      // Update project with collaborator assignment and payment
      const project = await Project.findByIdAndUpdate(
        projectId,
        { 
          assigned_collaborator: collaborator_id,
          collaborator_payment_amount: parseFloat(payment_amount.toString().replace('$', '').replace(',', '')),
          updated_at: new Date() 
        },
        { new: true }
      ).populate('assigned_collaborator', 'first_name last_name')

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      return ApiResponse.success(res, project, 'Collaborator assigned successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Unassign collaborator
  static async unassignCollaborator(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await Project.findByIdAndUpdate(
        projectId,
        { 
          assigned_collaborator: null,
          collaborator_payment_amount: undefined,
          updated_at: new Date() 
        },
        { new: true }
      )

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      return ApiResponse.success(res, project, 'Collaborator unassigned successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Claim revision (client can claim a revision)
  static async claimRevision(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { description } = req.body

      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Check if project is paid
      if (project.payment_status !== 'paid') {
        return ApiResponse.error(res, 'Project must be paid before claiming revisions', 400)
      }

      // Get current revision counts
      const revisionsUsed = project.revisions_used || 0
      const maxRevisions = project.max_revisions || 3

      // Check if revisions are available
      if (revisionsUsed >= maxRevisions) {
        return ApiResponse.error(res, `All ${maxRevisions} revisions have been used`, 400)
      }

      // Prepare update data
      const updateData: any = {
        revisions_used: revisionsUsed + 1,
        status: 'revision',
        updated_at: new Date()
      }

      // Store revision description in status_notes.revision
      if (typeof description === 'string' && description.trim().length > 0) {
        updateData['status_notes.revision'] = description.trim()
      }

      // Update project: increment revisions_used and set status to 'revision'
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        updateData,
        { new: true }
      )

      return ApiResponse.success(
        res,
        updatedProject,
        `Revision claimed successfully. ${maxRevisions - (revisionsUsed + 1)} revision(s) remaining.`
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all monthly invoices grouped by month (admin)
  static async getMonthlyInvoices(req: Request, res: Response) {
    try {
      // Find all projects with monthly invoices
      const monthlyInvoiceProjects = await Project.find({
        invoice_type: 'monthly',
        monthly_invoice_id: { $exists: true, $ne: null },
        invoice_url: { $exists: true, $ne: null },
      })
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ monthly_invoice_month: -1, invoice_uploaded_at: -1 })

      // Group by monthly_invoice_id
      const groupedInvoices: Record<string, any> = {}

      monthlyInvoiceProjects.forEach((project) => {
        const invoiceId = project.monthly_invoice_id!
        if (!groupedInvoices[invoiceId]) {
          groupedInvoices[invoiceId] = {
            monthly_invoice_id: invoiceId,
            month: project.monthly_invoice_month,
            invoice_url: project.invoice_url,
            invoice_public_id: project.invoice_public_id,
            invoice_status: project.invoice_status,
            invoice_uploaded_at: project.invoice_uploaded_at,
            invoice_approved_at: project.invoice_approved_at,
            projects: [],
            total_amount: 0,
            collaborator: project.assigned_collaborator,
          }
        }

        groupedInvoices[invoiceId].projects.push({
          _id: project._id,
          name: project.name,
          client_name: project.client_name,
          collaborator_payment_amount: project.collaborator_payment_amount,
          status: project.status,
        })

        groupedInvoices[invoiceId].total_amount += project.collaborator_payment_amount || 0
      })

      // Convert to array and sort by month
      const invoices = Object.values(groupedInvoices).sort((a: any, b: any) => {
        if (a.month < b.month) return 1
        if (a.month > b.month) return -1
        return 0
      })

      return ApiResponse.success(res, invoices, 'Monthly invoices retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get all accepted (approved) invoices + amount paid per invoice + amount left to pay per collaborator (admin)
  static async getAcceptedInvoicesOverview(req: Request, res: Response) {
    try {
      const { Collaborator } = await import('../models/Collaborator')

      const approvedProjects = await Project.find({
        invoice_status: 'approved',
        invoice_url: { $exists: true, $ne: null },
        assigned_collaborator: { $exists: true, $ne: null },
      })
        .populate('assigned_collaborator', 'first_name last_name')
        .sort({ invoice_approved_at: -1 })

      const invoiceRows: Array<{
        id: string
        type: 'per-project' | 'monthly'
        label: string
        collaboratorId: string
        collaboratorName: string
        amount: number
        paid: boolean
        paidAt?: string
        projectId?: string
        monthlyInvoiceId?: string
        month?: string
      }> = []

      const monthlySeen = new Set<string>()

      for (const p of approvedProjects) {
        const collab = p.assigned_collaborator as any
        const collaboratorId = collab?._id?.toString() || ''
        const collaboratorName = collab
          ? `${collab.first_name || ''} ${collab.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown'
        const amount = p.collaborator_payment_amount || 0
        const paid = !!p.collaborator_paid
        const paidAt = p.collaborator_paid_at
          ? new Date(p.collaborator_paid_at).toISOString()
          : undefined

        if (p.invoice_type === 'monthly' && p.monthly_invoice_id) {
          if (!monthlySeen.has(p.monthly_invoice_id)) {
            monthlySeen.add(p.monthly_invoice_id)
            const group = approvedProjects.filter(
              (x: any) => x.monthly_invoice_id === p.monthly_invoice_id
            )
            const totalAmount = group.reduce(
              (sum: number, x: any) => sum + (x.collaborator_payment_amount || 0),
              0
            )
            const allPaid = group.every((x: any) => x.collaborator_paid)
            const firstPaidAt = group.find((x: any) => x.collaborator_paid_at)
              ?.collaborator_paid_at
            const monthLabel = p.monthly_invoice_month
              ? new Date(p.monthly_invoice_month + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Monthly'
            invoiceRows.push({
              id: p.monthly_invoice_id,
              type: 'monthly',
              label: `${monthLabel} – Monthly Invoice`,
              collaboratorId,
              collaboratorName,
              amount: totalAmount,
              paid: allPaid,
              paidAt: firstPaidAt
                ? new Date(firstPaidAt).toISOString()
                : undefined,
              monthlyInvoiceId: p.monthly_invoice_id,
              month: p.monthly_invoice_month,
            })
          }
        } else {
          invoiceRows.push({
            id: (p._id as any).toString(),
            type: 'per-project',
            label: p.name,
            collaboratorId,
            collaboratorName,
            amount,
            paid,
            paidAt,
            projectId: (p._id as any).toString(),
          })
        }
      }

      const collaborators = await Collaborator.find().sort({ first_name: 1, last_name: 1 })
      const byCollaborator: Array<{
        collaboratorId: string
        collaboratorName: string
        totalPaid: number
        totalLeftToPay: number
      }> = []

      for (const c of collaborators) {
        const cid = (c._id as any).toString()
        const paidProjects = approvedProjects.filter(
          (p: any) =>
            (p.assigned_collaborator?._id?.toString() || p.assigned_collaborator?.toString()) ===
              cid && p.collaborator_paid
        )
        const unpaidProjects = approvedProjects.filter(
          (p: any) =>
            (p.assigned_collaborator?._id?.toString() || p.assigned_collaborator?.toString()) ===
              cid && !p.collaborator_paid
        )
        const totalPaid = paidProjects.reduce(
          (sum: number, p: any) => sum + (p.collaborator_payment_amount || 0),
          0
        )
        const totalLeftToPay = unpaidProjects.reduce(
          (sum: number, p: any) => sum + (p.collaborator_payment_amount || 0),
          0
        )
        if (totalPaid > 0 || totalLeftToPay > 0) {
          byCollaborator.push({
            collaboratorId: cid,
            collaboratorName: `${c.first_name} ${c.last_name}`,
            totalPaid,
            totalLeftToPay,
          })
        }
      }

      return ApiResponse.success(
        res,
        {
          acceptedInvoices: invoiceRows,
          byCollaborator,
        },
        'Accepted invoices overview retrieved successfully'
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}
