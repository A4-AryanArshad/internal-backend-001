import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../views/response'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err)

  if (err.type === 'entity.parse.failed') {
    return ApiResponse.error(res, 'Invalid JSON in request body', 400)
  }

  if (err.name === 'ValidationError') {
    return ApiResponse.error(res, 'Validation error', 400, err.errors)
  }

  return ApiResponse.error(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500
  )
}




















