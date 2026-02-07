"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables FIRST before any other imports
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const briefingRoutes_1 = __importDefault(require("./routes/briefingRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const customQuoteRoutes_1 = __importDefault(require("./routes/customQuoteRoutes"));
const collaboratorRoutes_1 = __importDefault(require("./routes/collaboratorRoutes"));
const app = (0, express_1.default)();
const PORT = 3001;
// Middleware
// CORS configuration - support both local and deployed frontend
const LOCAL_FRONTEND = 'http://localhost:5173';
const DEPLOYED_FRONTEND = 'https://internal-frontend-two.vercel.app';
// Use deployed URL on Vercel, localhost when running locally
const FRONTEND_URL = process.env.VERCEL === '1' ? DEPLOYED_FRONTEND : LOCAL_FRONTEND;
const allowedOrigins = [LOCAL_FRONTEND, 'http://127.0.0.1:5173', DEPLOYED_FRONTEND];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow specific origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // In development, allow all origins for easier testing
            callback(null, true);
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Ensure database is connected before handling API routes (fixes serverless buffering timeout)
app.use('/api', async (req, res, next) => {
    try {
        await (0, database_1.connectDatabase)();
        next();
    }
    catch (err) {
        console.error('DB connection failed before request:', err);
        res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/services', serviceRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/briefings', briefingRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/custom-quotes', customQuoteRoutes_1.default);
app.use('/api/collaborators', collaboratorRoutes_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Export app for Vercel serverless functions
exports.default = app;
// Connect to database and start server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
    (0, database_1.connectDatabase)().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
            console.log(`☁️  Cloudinary configured for image uploads`);
        });
    });
}
else {
    // In Vercel, connect to database on first request
    (0, database_1.connectDatabase)().catch(console.error);
}
