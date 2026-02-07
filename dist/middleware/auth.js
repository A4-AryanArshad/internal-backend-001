"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Hardcoded JWT secret
const JWT_SECRET = 'your-secret-key-change-in-production-please-change-this-in-production';
// Verify JWT token middleware
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};
exports.authenticate = authenticate;
// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                };
            }
            catch (error) {
                // Token invalid, but continue without user
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
