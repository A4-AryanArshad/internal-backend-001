import { Request, Response } from 'express'
import { Project } from '../models/Project'
import { ProjectBriefing, BriefingImage } from '../models/Briefing'
import { ApiResponse } from '../views/response'

export class BriefingController {
  // Submit briefing (images + notes)
  static async submitBriefing(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { overall_description, images } = req.body

      // Verify project exists and is paid
      const project = await Project.findById(projectId)

      if (!project) {
        return ApiResponse.notFound(res, 'Project not found')
      }

      // Allow briefing submission before or after payment (as per workflow)

      // Create or update briefing
      let briefing = await ProjectBriefing.findOne({ project_id: projectId })

      if (briefing) {
        // Update existing briefing
        briefing.overall_description = overall_description
        briefing.submitted_at = new Date()
        await briefing.save()
      } else {
        // Create new briefing
        briefing = await ProjectBriefing.create({
          project_id: projectId,
          overall_description,
          submitted_at: new Date(),
        })
      }

      // Delete existing images
      await BriefingImage.deleteMany({ project_id: projectId })

      // Insert new images
      if (images && images.length > 0) {
        const imageRecords = images.map((img: any, index: number) => ({
          project_id: projectId,
          image_url: img.url,
          notes: img.notes || '',
          order: index,
        }))

        await BriefingImage.insertMany(imageRecords)
      }

      // Update project status
      await Project.findByIdAndUpdate(projectId, {
        status: 'in_progress',
      })

      // Get updated images
      const updatedImages = await BriefingImage.find({ project_id: projectId }).sort({ order: 1 })

      // Format images for response
      const formattedImages = updatedImages.map((img: any) => ({
        _id: img._id,
        id: img._id,
        url: img.image_url,
        notes: img.notes,
        order: img.order,
      }))

      return ApiResponse.success(res, {
        briefing,
        images: formattedImages,
      }, 'Briefing submitted successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get briefing for a project
  static async getBriefing(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const briefing = await ProjectBriefing.findOne({ project_id: projectId })
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
        briefing: briefing || null,
        images: formattedImages || [],
      })
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}
