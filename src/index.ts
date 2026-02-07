import dotenv from 'dotenv'
// Load environment variables FIRST before any other imports
dotenv.config()

import express from 'express'
import cors from 'cors'
import { connectDatabase } from './config/database'
import { errorHandler } from './middleware/errorHandler'

// Routes
import authRoutes from './routes/authRoutes'
import projectRoutes from './routes/projectRoutes'
import serviceRoutes from './routes/serviceRoutes'
import paymentRoutes from './routes/paymentRoutes'
import briefingRoutes from './routes/briefingRoutes'
import uploadRoutes from './routes/uploadRoutes'
import customQuoteRoutes from './routes/customQuoteRoutes'
import collaboratorRoutes from './routes/collaboratorRoutes'
import notificationRoutes from './routes/notificationRoutes'

const app = express()
const PORT = 3001

// Middleware
// CORS configuration - support both local and deployed frontend
const LOCAL_FRONTEND = 'http://localhost:5173'
const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app'
// Use deployed URL on Vercel, localhost when running locally
const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND
const allowedOrigins = [LOCAL_FRONTEND, 'http://127.0.0.1:5173', DEPLOYED_FRONTEND]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow specific origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      // In development, allow all origins for easier testing
      callback(null, true)
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ensure database is connected before handling API routes (fixes serverless buffering timeout)
app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (err) {
    console.error('DB connection failed before request:', err)
    res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/briefings', briefingRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/custom-quotes', customQuoteRoutes)
app.use('/api/collaborators', collaboratorRoutes)
app.use('/api/notifications', notificationRoutes)

// Error handling
app.use(errorHandler)

// Export app for Vercel serverless functions
export default app

// Connect to database and start server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`)
      console.log(`☁️  Cloudinary configured for image uploads`)
    })
  })
} else {
  // In Vercel, connect to database on first request
  connectDatabase().catch(console.error)
}
