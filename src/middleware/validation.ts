import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../views/response'

export const validateProjectId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params

  if (!projectId || typeof projectId !== 'string') {
    return ApiResponse.error(res, 'Invalid project ID', 400)
  }

  next()
}

export const validateServiceSelection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serviceId, customAmount } = req.body

  if (!serviceId && !customAmount) {
    return ApiResponse.error(
      res,
      'Either serviceId or customAmount must be provided',
      400
    )
  }

  if (customAmount && (isNaN(customAmount) || customAmount <= 0)) {
    return ApiResponse.error(res, 'Custom amount must be a positive number', 400)
  }

  next()
}

export const validateBriefing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { overall_description, images } = req.body

  if (!overall_description || overall_description.trim().length === 0) {
    return ApiResponse.error(res, 'Overall description is required', 400)
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return ApiResponse.error(res, 'At least one image is required', 400)
  }

  next()
}




















