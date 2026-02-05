import { Request, Response } from 'express'
import { Service } from '../models/Service'
import { ApiResponse } from '../views/response'

export class ServiceController {
  // Get all active services
  static async getServices(req: Request, res: Response) {
    try {
      const services = await Service.find({ is_active: true }).sort({ created_at: 1 })

      return ApiResponse.success(res, services, 'Services retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get service by ID
  static async getService(req: Request, res: Response) {
    try {
      const { serviceId } = req.params

      const service = await Service.findOne({ _id: serviceId, is_active: true })

      if (!service) {
        return ApiResponse.notFound(res, 'Service not found')
      }

      return ApiResponse.success(res, service, 'Service retrieved successfully')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}
