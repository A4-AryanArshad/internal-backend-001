"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BriefingController = void 0;
const Project_1 = require("../models/Project");
const Briefing_1 = require("../models/Briefing");
const response_1 = require("../views/response");
class BriefingController {
    // Submit briefing (images + notes)
    static async submitBriefing(req, res) {
        try {
            const { projectId } = req.params;
            const { overall_description, images } = req.body;
            // Verify project exists and is paid
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                return response_1.ApiResponse.notFound(res, 'Project not found');
            }
            // Allow briefing submission before or after payment (as per workflow)
            // Create or update briefing
            let briefing = await Briefing_1.ProjectBriefing.findOne({ project_id: projectId });
            if (briefing) {
                // Update existing briefing
                briefing.overall_description = overall_description;
                briefing.submitted_at = new Date();
                await briefing.save();
            }
            else {
                // Create new briefing
                briefing = await Briefing_1.ProjectBriefing.create({
                    project_id: projectId,
                    overall_description,
                    submitted_at: new Date(),
                });
            }
            // Delete existing images
            await Briefing_1.BriefingImage.deleteMany({ project_id: projectId });
            // Insert new images
            if (images && images.length > 0) {
                const imageRecords = images.map((img, index) => ({
                    project_id: projectId,
                    image_url: img.url,
                    notes: img.notes || '',
                    order: index,
                }));
                await Briefing_1.BriefingImage.insertMany(imageRecords);
            }
            // Update project status
            await Project_1.Project.findByIdAndUpdate(projectId, {
                status: 'in_progress',
            });
            // Get updated images
            const updatedImages = await Briefing_1.BriefingImage.find({ project_id: projectId }).sort({ order: 1 });
            // Format images for response
            const formattedImages = updatedImages.map((img) => ({
                _id: img._id,
                id: img._id,
                url: img.image_url,
                notes: img.notes,
                order: img.order,
            }));
            return response_1.ApiResponse.success(res, {
                briefing,
                images: formattedImages,
            }, 'Briefing submitted successfully');
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
    // Get briefing for a project
    static async getBriefing(req, res) {
        try {
            const { projectId } = req.params;
            const briefing = await Briefing_1.ProjectBriefing.findOne({ project_id: projectId });
            const images = await Briefing_1.BriefingImage.find({ project_id: projectId }).sort({ order: 1 });
            // Format images for response
            const formattedImages = images.map((img) => ({
                _id: img._id,
                id: img._id,
                url: img.image_url,
                notes: img.notes,
                order: img.order,
            }));
            return response_1.ApiResponse.success(res, {
                briefing: briefing || null,
                images: formattedImages || [],
            });
        }
        catch (error) {
            return response_1.ApiResponse.error(res, error.message, 500);
        }
    }
}
exports.BriefingController = BriefingController;
