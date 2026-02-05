import mongoose from 'mongoose'

// Hardcoded MongoDB connection string
const MONGODB_URI =
  'mongodb+srv://ali:ali@cluster0.o8bu9nt.mongodb.net/client-project-portal'



// Cache the connection to reuse in serverless environments
let cachedConnection: typeof mongoose | null = null

export const connectDatabase = async () => {
  // In serverless environments, reuse existing connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  try {
    // Set connection options for serverless
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
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

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err)
})

export default mongoose
