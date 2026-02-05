import { Request, Response } from 'express'
import { User } from '../models/User'
import { ApiResponse } from '../views/response'
import jwt from 'jsonwebtoken'

// Hardcoded JWT secret
const JWT_SECRET = 'your-secret-key-change-in-production-please-change-this-in-production'

// Generate JWT token
const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export class AuthController {
  // User signup
  static async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body

      if (!name || !email || !password) {
        return ApiResponse.error(res, 'Name, email, and password are required', 400)
      }

      if (password.length < 6) {
        return ApiResponse.error(res, 'Password must be at least 6 characters', 400)
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return ApiResponse.error(res, 'User with this email already exists', 400)
      }

      // Create new user
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'client',
      })

      // Generate token
      const token = generateToken(user._id.toString(), user.email, user.role)

      return ApiResponse.success(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        'User created successfully',
        201
      )
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // User login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return ApiResponse.error(res, 'Email and password are required', 400)
      }

      const normalizedEmail = email.toLowerCase()

      // Find user
      let user = await User.findOne({ email: normalizedEmail })

      // If no user found, allow hardcoded admin credentials to create the admin user on first login
      if (!user && normalizedEmail === 'admin1234@gmail.com' && password === 'admin1234') {
        user = await User.create({
          name: 'Admin',
          email: normalizedEmail,
          password,
          role: 'admin',
        })
      }

      if (!user) {
        return ApiResponse.error(res, 'Invalid email or password', 401)
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return ApiResponse.error(res, 'Invalid email or password', 401)
      }

      // Generate token
      const token = generateToken(user._id.toString(), user.email, user.role)

      return ApiResponse.success(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      })
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }

  // Get current user (protected route)
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return ApiResponse.error(res, 'User not authenticated', 401)
      }

      const user = await User.findById(userId).select('-password')
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404)
      }

      return ApiResponse.success(res, {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500)
    }
  }
}




