// Vercel serverless function entry point
import app from '../src/index'
import { connectDatabase } from '../src/config/database'

// Connect to database on cold start (Vercel serverless)
let isConnected = false

const connectDB = async () => {
  if (!isConnected) {
    try {
      await connectDatabase()
      isConnected = true
    } catch (error) {
      console.error('Database connection error:', error)
    }
  }
}


connectDB().catch(console.error)

export default app

