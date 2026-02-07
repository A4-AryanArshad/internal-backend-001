import { Response } from 'express'

export class ApiResponse {
  static success(res: Response, data: any, message?: string, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message: message || 'Operation successful',
      data,
    })
  }

  static error(res: Response, message: string, statusCode: number = 400, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors || undefined,
    })
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
    })
  }

  static unauthorized(res: Response, message: string = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message,
    })
  }
}




















