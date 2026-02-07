"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const Project_1 = require("../models/Project");
const response_1 = require("../views/response");
class ProjectController {
    // Get project by ID (for client link validation)
    static async getProject(req, res) {
        try {
            const { projectId } = req.params;
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found or invalid link');
            }
            // Client role: allow access if they own the project OR project is unclaimed/unpaid (so they can start purchase flow)
            const authReq = req;
            if (authReq.user?.role === 'client') {
                const projectEmail = (project.client_email || '').toLowerCase();
                const userEmail = (authReq.user.email || '').toLowerCase();
                const isOwner = projectEmail && projectEmail === userEmail;
                const isUnclaimedOrUnpaid = !projectEmail || project.payment_status !== 'paid';
                if (!isOwner && !isUnclaimedOrUnpaid) {
                    return response_1.ApiResponse.error(res, 'You do not have access to this project', 403);
                }
            }
            return response_1.ApiResponse.success(res, project, 'Project retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Update project service selection
    static async updateServiceSelection(req, res) {
        try {
            const { projectId } = req.params;
            const { serviceId, customAmount } = req.body;
            // Verify project exists
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Update project with service selection
            const updateData = {};
            if (serviceId) {
                updateData.selected_service = serviceId;
            }
            else if (customAmount) {
                updateData.custom_quote_amount = customAmount;
            }
            const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, updateData, { new: true });
            return response_1.ApiResponse.success(res, updatedProject, 'Service selection updated');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get project with full details (for client dashboard)
    static async getProjectDetails(req, res) {
        try {
            const { projectId } = req.params;
            const project = await Project_1.Project.findById(projectId)
                .populate('selected_service')
                .populate('assigned_collaborator', 'first_name last_name')
                .populate('custom_quote_request', 'description');
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Client role: allow access if they own the project OR project is unclaimed/unpaid (so they can start purchase flow)
            const authReq = req;
            if (authReq.user?.role === 'client') {
                const projectEmail = (project.client_email || '').toLowerCase();
                const userEmail = (authReq.user.email || '').toLowerCase();
                const isOwner = projectEmail && projectEmail === userEmail;
                const isUnclaimedOrUnpaid = !projectEmail || project.payment_status !== 'paid';
                if (!isOwner && !isUnclaimedOrUnpaid) {
                    return response_1.ApiResponse.error(res, 'You do not have access to this project', 403);
                }
            }
            // Get briefing
            const { ProjectBriefing } = await Promise.resolve().then(() => __importStar(require('../models/Briefing')));
            const briefing = await ProjectBriefing.findOne({ project_id: projectId });
            // Get briefing images
            const { BriefingImage } = await Promise.resolve().then(() => __importStar(require('../models/Briefing')));
            const images = await BriefingImage.find({ project_id: projectId }).sort({ order: 1 });
            // Format images for response
            const formattedImages = images.map((img) => ({
                _id: img._id,
                id: img._id,
                url: img.image_url,
                notes: img.notes,
                order: img.order,
            }));
            return response_1.ApiResponse.success(res, {
                project,
                briefing: briefing || null,
                images: formattedImages || [],
            });
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Create new project (admin)
    static async createProject(req, res) {
        try {
            const { name, client_name, client_email, project_type, service, service_price, amount, deadline } = req.body;
            if (!name) {
                return response_1.ApiResponse.error(res, 'Project name is required', 400);
            }
            const projectData = {
                name,
                client_name: client_name || 'Client', // Default client name if not provided
                client_email: client_email || undefined,
                project_type: project_type || 'simple', // 'simple' or 'custom'
                status: 'pending',
                payment_status: 'pending',
            };
            // Handle service selection for simple projects
            if (project_type === 'simple' && service && service !== 'Custom Service') {
                // Store the service name and price directly (no need to link to Service model)
                // Simple projects are accessible to anyone via link
                projectData.service_name = service;
                projectData.delivery_timeline = '30 days'; // Default delivery timeline
                // Parse and store the service price
                if (service_price) {
                    const price = parseFloat(service_price.toString().replace('$', '').replace(',', '').trim());
                    if (!isNaN(price)) {
                        projectData.service_price = price;
                    }
                }
            }
            else if (project_type === 'custom' || (service === 'Custom Service' && amount)) {
                // Custom project - set default delivery timeline
                projectData.project_type = 'custom';
                projectData.delivery_timeline = '30 days'; // Default, admin can adjust
                if (amount) {
                    projectData.custom_quote_amount = parseFloat(amount.toString().replace('$', '').replace(',', ''));
                }
            }
            if (deadline) {
                projectData.deadline = new Date(deadline);
            }
            const project = await Project_1.Project.create(projectData);
            return response_1.ApiResponse.success(res, project, 'Project created successfully', 201);
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get all projects (admin)
    static async getAllProjects(req, res) {
        try {
            const projects = await Project_1.Project.find()
                .populate('selected_service')
                .populate('assigned_collaborator', 'first_name last_name')
                .sort({ created_at: -1 });
            return response_1.ApiResponse.success(res, projects, 'Projects retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get all projects for a specific client (by email)
    static async getClientProjects(req, res) {
        try {
            const { email } = req.params;
            if (!email) {
                return response_1.ApiResponse.error(res, 'Client email is required', 400);
            }
            const projects = await Project_1.Project.find({ client_email: email })
                .populate('selected_service')
                .sort({ created_at: -1 });
            return response_1.ApiResponse.success(res, projects, 'Client projects retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get all simple projects (public, no auth required)
    static async getSimpleProjects(req, res) {
        try {
            const projects = await Project_1.Project.find({ project_type: 'simple' })
                .populate('selected_service')
                .sort({ created_at: -1 });
            return response_1.ApiResponse.success(res, projects, 'Simple projects retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get or create an unclaimed project so a client can submit requirements and pay (when the catalog project they clicked is already taken)
    static async startFromCatalog(req, res) {
        try {
            const authReq = req;
            if (authReq.user?.role !== 'client') {
                return response_1.ApiResponse.error(res, 'Only clients can start a project from the catalog', 403);
            }
            const { projectId } = req.body;
            if (!projectId) {
                return response_1.ApiResponse.error(res, 'projectId is required', 400);
            }
            const template = await Project_1.Project.findById(projectId);
            if (!template || template.project_type !== 'simple') {
                return response_1.ApiResponse.error(res, 'Project not found or not a catalog project', 404);
            }
            const name = template.name;
            const servicePrice = template.service_price;
            const unclaimed = await Project_1.Project.findOne({
                project_type: 'simple',
                name,
                service_price: servicePrice,
                $or: [
                    { client_email: { $in: [null, ''] } },
                    { payment_status: { $ne: 'paid' } },
                ],
            })
                .populate('selected_service');
            if (unclaimed) {
                return response_1.ApiResponse.success(res, unclaimed, 'Unclaimed project found');
            }
            const newProject = await Project_1.Project.create({
                name,
                client_name: 'Client',
                project_type: 'simple',
                service_name: template.service_name,
                service_price: servicePrice,
                delivery_timeline: template.delivery_timeline || '30 days',
                status: 'pending',
                payment_status: 'pending',
            });
            const populated = await Project_1.Project.findById(newProject._id).populate('selected_service');
            return response_1.ApiResponse.success(res, populated || newProject, 'Project created for you to complete', 201);
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get all projects for authenticated client (uses JWT token)
    static async getMyProjects(req, res) {
        try {
            const userEmail = req.user?.email;
            if (!userEmail) {
                return response_1.ApiResponse.error(res, 'User not authenticated', 401);
            }
            const projects = await Project_1.Project.find({ client_email: userEmail })
                .populate('selected_service')
                .sort({ created_at: -1 });
            return response_1.ApiResponse.success(res, projects, 'Your projects retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Update project status
    static async updateStatus(req, res) {
        try {
            const { projectId } = req.params;
            const { status, notes } = req.body;
            if (!status) {
                return response_1.ApiResponse.error(res, 'Status is required', 400);
            }
            // Check if project exists
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Invoice approval is no longer required for status changes
            // Collaborators can change project status regardless of invoice status
            const update = { status, updated_at: new Date() };
            // Track when project is completed
            if (status === 'completed' && project.status !== 'completed') {
                update.completed_at = new Date();
            }
            if (typeof notes === 'string' && notes.trim().length > 0) {
                // Store note under the specific status key (e.g. status_notes.review)
                update[`status_notes.${status}`] = notes.trim();
            }
            const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, update, { new: true });
            if (!updatedProject) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            return response_1.ApiResponse.success(res, updatedProject, 'Status updated successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Approve invoice (admin only)
    static async approveInvoice(req, res) {
        try {
            const { projectId } = req.params;
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            if (!project.invoice_url) {
                return response_1.ApiResponse.error(res, 'No invoice uploaded for this project', 400);
            }
            if (project.invoice_status === 'approved') {
                return response_1.ApiResponse.error(res, 'Invoice is already approved', 400);
            }
            // If this is a monthly invoice, approve all projects in the same monthly invoice group
            if (project.invoice_type === 'monthly' && project.monthly_invoice_id) {
                const monthlyInvoiceId = project.monthly_invoice_id;
                const updateResult = await Project_1.Project.updateMany({ monthly_invoice_id: monthlyInvoiceId }, {
                    invoice_status: 'approved',
                    invoice_approved_at: new Date(),
                    updated_at: new Date(),
                });
                const updatedProjects = await Project_1.Project.find({ monthly_invoice_id: monthlyInvoiceId })
                    .populate('assigned_collaborator', 'first_name last_name');
                return response_1.ApiResponse.success(res, { projects: updatedProjects, count: updateResult.modifiedCount }, `Monthly invoice approved successfully for ${updateResult.modifiedCount} project(s)`);
            }
            // Regular per-project invoice approval
            const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, {
                invoice_status: 'approved',
                invoice_approved_at: new Date(),
                updated_at: new Date(),
            }, { new: true }).populate('assigned_collaborator', 'first_name last_name');
            return response_1.ApiResponse.success(res, updatedProject, 'Invoice approved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Reject invoice (admin only) - optional
    static async rejectInvoice(req, res) {
        try {
            const { projectId } = req.params;
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            if (!project.invoice_url) {
                return response_1.ApiResponse.error(res, 'No invoice uploaded for this project', 400);
            }
            // If this is a monthly invoice, reject all projects in the same monthly invoice group
            if (project.invoice_type === 'monthly' && project.monthly_invoice_id) {
                const monthlyInvoiceId = project.monthly_invoice_id;
                const updateResult = await Project_1.Project.updateMany({ monthly_invoice_id: monthlyInvoiceId }, {
                    invoice_status: 'rejected',
                    updated_at: new Date(),
                });
                const updatedProjects = await Project_1.Project.find({ monthly_invoice_id: monthlyInvoiceId })
                    .populate('assigned_collaborator', 'first_name last_name');
                return response_1.ApiResponse.success(res, { projects: updatedProjects, count: updateResult.modifiedCount }, `Monthly invoice rejected for ${updateResult.modifiedCount} project(s)`);
            }
            // Regular per-project invoice rejection
            const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, {
                invoice_status: 'rejected',
                updated_at: new Date(),
            }, { new: true }).populate('assigned_collaborator', 'first_name last_name');
            return response_1.ApiResponse.success(res, updatedProject, 'Invoice rejected');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Assign collaborator
    static async assignCollaborator(req, res) {
        try {
            const { projectId } = req.params;
            const { collaborator_id, payment_amount } = req.body;
            if (!collaborator_id) {
                return response_1.ApiResponse.error(res, 'Collaborator ID is required', 400);
            }
            if (!payment_amount || payment_amount <= 0) {
                return response_1.ApiResponse.error(res, 'Payment amount is required and must be greater than 0', 400);
            }
            // Verify collaborator exists
            const { Collaborator } = await Promise.resolve().then(() => __importStar(require('../models/Collaborator')));
            const collaborator = await Collaborator.findById(collaborator_id);
            if (!collaborator) {
                return response_1.ApiResponse.notFound(res, 'Collaborator not found');
            }
            // Update project with collaborator assignment and payment
            const project = await Project_1.Project.findByIdAndUpdate(projectId, {
                assigned_collaborator: collaborator_id,
                collaborator_payment_amount: parseFloat(payment_amount.toString().replace('$', '').replace(',', '')),
                updated_at: new Date()
            }, { new: true }).populate('assigned_collaborator', 'first_name last_name');
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            return response_1.ApiResponse.success(res, project, 'Collaborator assigned successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Unassign collaborator
    static async unassignCollaborator(req, res) {
        try {
            const { projectId } = req.params;
            const project = await Project_1.Project.findByIdAndUpdate(projectId, {
                assigned_collaborator: null,
                collaborator_payment_amount: undefined,
                updated_at: new Date()
            }, { new: true });
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            return response_1.ApiResponse.success(res, project, 'Collaborator unassigned successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Claim revision (client can claim a revision)
    static async claimRevision(req, res) {
        try {
            const { projectId } = req.params;
            const { description } = req.body;
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Check if project is paid
            if (project.payment_status !== 'paid') {
                return response_1.ApiResponse.error(res, 'Project must be paid before claiming revisions', 400);
            }
            // Get current revision counts
            const revisionsUsed = project.revisions_used || 0;
            const maxRevisions = project.max_revisions || 3;
            // Check if revisions are available
            if (revisionsUsed >= maxRevisions) {
                return response_1.ApiResponse.error(res, `All ${maxRevisions} revisions have been used`, 400);
            }
            // Prepare update data
            const updateData = {
                revisions_used: revisionsUsed + 1,
                status: 'revision',
                updated_at: new Date()
            };
            // Store revision description in status_notes.revision
            if (typeof description === 'string' && description.trim().length > 0) {
                updateData['status_notes.revision'] = description.trim();
            }
            // Update project: increment revisions_used and set status to 'revision'
            const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, updateData, { new: true });
            return response_1.ApiResponse.success(res, updatedProject, `Revision claimed successfully. ${maxRevisions - (revisionsUsed + 1)} revision(s) remaining.`);
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get all monthly invoices grouped by month (admin)
    static async getMonthlyInvoices(req, res) {
        try {
            // Find all projects with monthly invoices
            const monthlyInvoiceProjects = await Project_1.Project.find({
                invoice_type: 'monthly',
                monthly_invoice_id: { $exists: true, $ne: null },
                invoice_url: { $exists: true, $ne: null },
            })
                .populate('assigned_collaborator', 'first_name last_name')
                .sort({ monthly_invoice_month: -1, invoice_uploaded_at: -1 });
            // Group by monthly_invoice_id
            const groupedInvoices = {};
            monthlyInvoiceProjects.forEach((project) => {
                const invoiceId = project.monthly_invoice_id;
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
                    };
                }
                groupedInvoices[invoiceId].projects.push({
                    _id: project._id,
                    name: project.name,
                    client_name: project.client_name,
                    collaborator_payment_amount: project.collaborator_payment_amount,
                    status: project.status,
                });
                groupedInvoices[invoiceId].total_amount += project.collaborator_payment_amount || 0;
            });
            // Convert to array and sort by month
            const invoices = Object.values(groupedInvoices).sort((a, b) => {
                if (a.month < b.month)
                    return 1;
                if (a.month > b.month)
                    return -1;
                return 0;
            });
            return response_1.ApiResponse.success(res, invoices, 'Monthly invoices retrieved successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
}
exports.ProjectController = ProjectController;
