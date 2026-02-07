import mongoose from 'mongoose'

// Hardcoded MongoDB connection string
const MONGODB_URI =
  'mongodb+srv://ali:ali@cluster0.o8bu9nt.mongodb.net/client-project-portal'

// Increase buffer timeout so cold-start connections don't fail (default 10s -> 30s)
mongoose.set('bufferTimeoutMS', 30000)

// Cache the connection to reuse in serverless environments
let cachedConnection: typeof mongoose | null = null

export const connectDatabase = async () => {
  // In serverless environments, reuse existing connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  try {
    // Set connection options for serverless (longer timeouts to avoid buffering timeout on cold start)
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // Wait up to 15s for server selection
      socketTimeoutMS: 45000,
    }

    cachedConnection = await mongoose.connect(MONGODB_URI, options)
    console.log('✅ Connected to MongoDB')
    return cachedConnection
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    // In serverless, don't exit process, just throw
    if (process.env.VERCEL === '1') {
      throw error
    }
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

mongoose.connection.on('error', (err: unknown) => {
  console.error('MongoDB error:', err)
})

export default mongoose
