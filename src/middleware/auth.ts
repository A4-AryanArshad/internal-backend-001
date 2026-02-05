import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Hardcoded JWT secret
const JWT_SECRET = 'your-secret-key-change-in-production-please-change-this-in-production'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

// Verify JWT token middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      ;(req as AuthRequest).user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      }
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      })
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    })
  }
}

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        ;(req as AuthRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        }
      } catch (error) {
        // Token invalid, but continue without user
      }
    }
    next()
  } catch (error) {
    next()
  }
}

















