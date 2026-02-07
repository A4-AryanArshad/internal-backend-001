import { Request, Response } from 'express'
import { Notification } from '../models/Notification'
import { ApiResponse } from '../views/response'
import { AuthRequest } from '../middleware/auth'

export class NotificationController {
  /** Get all notifications for the current admin (newest first). */
  static async getMine(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId
      if (!userId) {
        return ApiResponse.error(res, 'Not authenticated', 401)
      }
      if (authReq.user?.role !== 'admin') {
        return ApiResponse.error(res, 'Admin only', 403)
      }
      const list = await Notification.find({ recipient: userId })
        .sort({ created_at: -1 })
        .limit(100)
      const unreadCount = await Notification.countDocuments({ recipient: userId, read: false })
      return ApiResponse.success(res, { notifications: list, unreadCount }, 'Notifications retrieved')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  /** Get only unread count (for badge). */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId
      if (!userId || authReq.user?.role !== 'admin') {
        return ApiResponse.success(res, { unreadCount: 0 }, 'OK')
      }
      const unreadCount = await Notification.countDocuments({ recipient: userId, read: false })
      return ApiResponse.success(res, { unreadCount }, 'OK')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  /** Mark one notification as read. */
  static async markRead(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId
      const { notificationId } = req.params
      if (!userId || authReq.user?.role !== 'admin') {
        return ApiResponse.error(res, 'Admin only', 403)
      }
      const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true },
        { new: true }
      )
      if (!updated) return ApiResponse.notFound(res, 'Notification not found')
      return ApiResponse.success(res, updated, 'Marked as read')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  /** Mark all notifications as read for the current admin. */
  static async markAllRead(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.user?.userId
      if (!userId || authReq.user?.role !== 'admin') {
        return ApiResponse.error(res, 'Admin only', 403)
      }
      await Notification.updateMany({ recipient: userId }, { read: true })
      return ApiResponse.success(res, {}, 'All marked as read')
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}
