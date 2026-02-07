"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const Project_1 = require("../models/Project");
const Collaborator_1 = require("../models/Collaborator");
const response_1 = require("../views/response");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const stream_1 = require("stream");
class UploadController {
    // Upload image to Cloudinary
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return response_1.ApiResponse.error(res, 'No file uploaded', 400);
            }
            const { projectId } = req.params;
            const file = req.file;
            // Verify project exists
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Convert buffer to stream for Cloudinary
            const stream = stream_1.Readable.from(file.buffer);
            // Upload to Cloudinary
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: `client-project-portal/${projectId}`,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    if (!result) {
                        return reject(new Error('Upload failed - no result from Cloudinary'));
                    }
                    response_1.ApiResponse.success(res, {
                        url: result.secure_url,
                        public_id: result.public_id,
                        width: result.width,
                        height: result.height,
                    }, 'Image uploaded successfully');
                    resolve();
                });
                stream.pipe(uploadStream);
            }).catch((error) => {
                return response_1.ApiResponse.error(res, error.message || 'Failed to upload image', 500);
            });
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Delete image from Cloudinary (optional helper)
    static async deleteImage(req, res) {
        try {
            const { publicId } = req.params;
            const result = await cloudinary_1.default.uploader.destroy(publicId);
            if (result.result === 'ok') {
                return response_1.ApiResponse.success(res, { deleted: true }, 'Image deleted successfully');
            }
            else {
                return response_1.ApiResponse.error(res, 'Failed to delete image', 400);
            }
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Upload invoice document (PDF, DOC, DOCX)
    static async uploadInvoice(req, res) {
        try {
            if (!req.file) {
                return response_1.ApiResponse.error(res, 'No file uploaded', 400);
            }
            const { projectId } = req.params;
            const file = req.file;
            // Verify project exists and is assigned to a collaborator
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            if (!project.assigned_collaborator) {
                return response_1.ApiResponse.error(res, 'Project must be assigned to a collaborator before uploading invoice', 400);
            }
            // Upload invoice to Cloudinary using streaming method (preserves binary integrity)
            // Use 'raw' resource_type to preserve file exactly as-is without any processing
            const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
            const baseFilename = file.originalname.replace(/\.[^/.]+$/, '') || 'invoice';
            // Convert buffer to stream for Cloudinary (same method as images - preserves binary data)
            const stream = stream_1.Readable.from(file.buffer);
            // Upload to Cloudinary using streaming method with 'raw' resource_type
            // This preserves the file exactly as uploaded without any transformations
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: `client-project-portal/${projectId}/invoices`,
                    resource_type: 'raw', // Use 'raw' to preserve file exactly as-is
                    public_id: `${baseFilename}.${fileExtension}`, // Preserve file extension
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                    access_mode: 'public', // Ensure file is publicly accessible
                    type: 'upload', // Explicitly set as uploaded file
                }, async (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    if (!result) {
                        return reject(new Error('Upload failed - no result from Cloudinary'));
                    }
                    // Update project with invoice URL, public_id, and status
                    await Project_1.Project.findByIdAndUpdate(projectId, {
                        invoice_url: result.secure_url,
                        invoice_public_id: result.public_id,
                        invoice_status: 'pending',
                        invoice_uploaded_at: new Date(),
                        invoice_type: 'per-project',
                        updated_at: new Date(),
                    });
                    response_1.ApiResponse.success(res, {
                        url: result.secure_url,
                        public_id: result.public_id,
                    }, 'Invoice uploaded successfully');
                    resolve();
                });
                stream.pipe(uploadStream);
            }).catch((error) => {
                return response_1.ApiResponse.error(res, error.message || 'Failed to upload invoice', 500);
            });
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Proxy endpoint to serve invoice PDF with correct content-type headers
    static async serveInvoice(req, res) {
        try {
            const { projectId } = req.params;
            // Get project to find invoice URL
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            if (!project.invoice_url) {
                return response_1.ApiResponse.notFound(res, 'Invoice not found for this project');
            }
            // Store invoice URL in a const to satisfy TypeScript
            const invoiceUrl = project.invoice_url;
            const invoicePublicId = project.invoice_public_id;
            // Helper function to send the file with proper headers
            const sendFile = (buffer) => {
                // Determine content type based on file extension
                const urlLower = invoiceUrl.toLowerCase();
                let contentType = 'application/pdf';
                if (urlLower.endsWith('.doc')) {
                    contentType = 'application/msword';
                }
                else if (urlLower.endsWith('.docx')) {
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                }
                // Set headers for browser viewing
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `inline; filename="${invoiceUrl.split('/').pop()}"`);
                res.setHeader('Content-Length', buffer.length.toString());
                res.setHeader('Cache-Control', 'private, max-age=3600');
                // Send the file
                res.send(buffer);
            };
            // Use Cloudinary's API endpoint to download the file with authentication
            // The issue is that secure_urls for raw files might require authentication
            if (invoicePublicId) {
                try {
                    // Use Cloudinary's API endpoint to download the file directly
                    // Format: https://api.cloudinary.com/v1_1/{cloud_name}/resources/raw/upload/{public_id}
                    // Hardcoded Cloudinary credentials
                    const cloudName = 'dftnqqcjz';
                    const apiKey = '419724397335875';
                    const apiSecret = 'Q7usOM7s5EsyeubXFzy5fQ1I_7A';
                    if (!cloudName || !apiKey || !apiSecret) {
                        throw new Error('Cloudinary credentials not configured');
                    }
                    // Use Cloudinary's authenticated download endpoint
                    // We'll fetch from the secure_url but add authentication
                    // Actually, let's try using the direct secure_url first - it should work if file is public
                    const https = require('https');
                    const parsedUrl = new URL(invoiceUrl);
                    return new Promise((resolve, reject) => {
                        // Try the secure_url directly first (should work if file is public)
                        const request = https.get(parsedUrl.href, (response) => {
                            if (response.statusCode === 200) {
                                const chunks = [];
                                response.on('data', (chunk) => {
                                    chunks.push(chunk);
                                });
                                response.on('end', () => {
                                    try {
                                        sendFile(Buffer.concat(chunks));
                                        resolve();
                                    }
                                    catch (error) {
                                        reject(error);
                                    }
                                });
                            }
                            else if (response.statusCode === 401) {
                                // If 401, the file is not publicly accessible
                                // We need to re-upload with access_mode: 'public' or use a different approach
                                reject(new Error(`Invoice file is not publicly accessible (401). Please re-upload the invoice - it will be uploaded with public access.`));
                            }
                            else {
                                reject(new Error(`Failed to fetch invoice from Cloudinary. Status: ${response.statusCode}.`));
                            }
                        });
                        request.on('error', (error) => {
                            reject(new Error(`Failed to fetch invoice: ${error.message}`));
                        });
                        request.setTimeout(30000, () => {
                            request.destroy();
                            reject(new Error('Request timeout'));
                        });
                    }).catch((error) => {
                        return response_1.ApiResponse.error(res, error.message || 'Failed to serve invoice', 500);
                    });
                }
                catch (cloudinaryError) {
                    console.error('Error accessing Cloudinary file:', cloudinaryError);
                    return response_1.ApiResponse.error(res, cloudinaryError.message || 'Failed to serve invoice', 500);
                }
            }
            else {
                // No public_id stored - this is an old invoice uploaded before we stored public_id
                // Try to fetch from secure_url, but it will likely fail with 401
                const https = require('https');
                const parsedUrl = new URL(invoiceUrl);
                return new Promise((resolve, reject) => {
                    const request = https.get(parsedUrl.href, (response) => {
                        if (response.statusCode === 200) {
                            const chunks = [];
                            response.on('data', (chunk) => {
                                chunks.push(chunk);
                            });
                            response.on('end', () => {
                                try {
                                    sendFile(Buffer.concat(chunks));
                                    resolve();
                                }
                                catch (error) {
                                    reject(error);
                                }
                            });
                        }
                        else {
                            reject(new Error(`Failed to fetch invoice. Status: ${response.statusCode}. This invoice was uploaded before we added public access. Please re-upload the invoice.`));
                        }
                    });
                    request.on('error', (error) => {
                        reject(new Error(`Failed to fetch invoice: ${error.message}`));
                    });
                    request.setTimeout(30000, () => {
                        request.destroy();
                        reject(new Error('Request timeout'));
                    });
                }).catch((error) => {
                    return response_1.ApiResponse.error(res, error.message || 'Failed to serve invoice', 500);
                });
            }
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message || 'Failed to serve invoice', 500);
        }
    }
    // Upload monthly combined invoice (one invoice for all completed projects in a month)
    static async uploadMonthlyInvoice(req, res) {
        try {
            if (!req.file) {
                return response_1.ApiResponse.error(res, 'No file uploaded', 400);
            }
            const authReq = req;
            const userId = authReq.user?.userId;
            if (!userId) {
                return response_1.ApiResponse.error(res, 'Not authenticated', 401);
            }
            const { month } = req.body; // Format: "YYYY-MM" (e.g., "2024-01")
            if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
                return response_1.ApiResponse.error(res, 'Invalid month format. Use YYYY-MM (e.g., 2024-01)', 400);
            }
            // Get collaborator
            const collaborator = await Collaborator_1.Collaborator.findOne({ user_id: userId });
            if (!collaborator) {
                return response_1.ApiResponse.error(res, 'Collaborator profile not found', 404);
            }
            // Find all completed projects for this collaborator in the specified month
            // Use completed_at if available, otherwise updated_at
            // Include projects with rejected monthly invoices for this month (to allow re-upload)
            const startDate = new Date(`${month}-01`);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
            const projects = await Project_1.Project.find({
                assigned_collaborator: collaborator._id,
                status: 'completed',
                payment_status: 'paid',
                $and: [
                    {
                        $or: [
                            { completed_at: { $gte: startDate, $lte: endDate } },
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
                            { monthly_invoice_id: { $exists: false } },
                            { monthly_invoice_id: null },
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
            });
            if (projects.length === 0) {
                return response_1.ApiResponse.error(res, `No completed projects found for month ${month}`, 400);
            }
            const file = req.file;
            const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
            const baseFilename = `monthly-invoice-${month}`;
            // Generate unique monthly invoice ID
            const monthlyInvoiceId = `monthly-${month}-${Date.now()}`;
            // Convert buffer to stream for Cloudinary
            const stream = stream_1.Readable.from(file.buffer);
            // Upload to Cloudinary
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: `client-project-portal/monthly-invoices/${month}`,
                    resource_type: 'raw',
                    public_id: `${baseFilename}.${fileExtension}`,
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                    access_mode: 'public',
                    type: 'upload',
                }, async (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    if (!result) {
                        return reject(new Error('Upload failed - no result from Cloudinary'));
                    }
                    // Update all projects with the monthly invoice information
                    const updatePromises = projects.map((project) => Project_1.Project.findByIdAndUpdate(project._id, {
                        invoice_url: result.secure_url,
                        invoice_public_id: result.public_id,
                        invoice_status: 'pending',
                        invoice_uploaded_at: new Date(),
                        invoice_type: 'monthly',
                        monthly_invoice_id: monthlyInvoiceId,
                        monthly_invoice_month: month,
                        updated_at: new Date(),
                    }));
                    await Promise.all(updatePromises);
                    // Calculate total amount
                    const totalAmount = projects.reduce((sum, project) => {
                        return sum + (project.collaborator_payment_amount || 0);
                    }, 0);
                    response_1.ApiResponse.success(res, {
                        url: result.secure_url,
                        public_id: result.public_id,
                        monthly_invoice_id: monthlyInvoiceId,
                        month,
                        projects_count: projects.length,
                        total_amount: totalAmount,
                        project_ids: projects.map((p) => p._id.toString()),
                    }, `Monthly invoice uploaded successfully for ${projects.length} project(s)`);
                    resolve();
                });
                stream.pipe(uploadStream);
            }).catch((error) => {
                return response_1.ApiResponse.error(res, error.message || 'Failed to upload monthly invoice', 500);
            });
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
}
exports.UploadController = UploadController;
