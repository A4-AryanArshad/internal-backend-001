"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Hardcoded MongoDB connection string
const MONGODB_URI = 'mongodb+srv://ali:ali@cluster0.o8bu9nt.mongodb.net/client-project-portal';
// Increase buffer timeout so cold-start connections don't fail (default 10s -> 30s)
mongoose_1.default.set('bufferTimeoutMS', 30000);
// Cache the connection to reuse in serverless environments
let cachedConnection = null;
const connectDatabase = async () => {
    // In serverless environments, reuse existing connection
    if (cachedConnection && mongoose_1.default.connection.readyState === 1) {
        return cachedConnection;
    }
    try {
        // Set connection options for serverless (longer timeouts to avoid buffering timeout on cold start)
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 15000, // Wait up to 15s for server selection
            socketTimeoutMS: 45000,
        };
        cachedConnection = await mongoose_1.default.connect(MONGODB_URI, options);
        console.log('✅ Connected to MongoDB');
        return cachedConnection;
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        // In serverless, don't exit process, just throw
        if (process.env.VERCEL === '1') {
            throw error;
        }
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
// Handle connection events
mongoose_1.default.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});
exports.default = mongoose_1.default;
