"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Vercel serverless function entry point
const index_1 = __importDefault(require("../src/index"));
const database_1 = require("../src/config/database");
// Connect to database on cold start (Vercel serverless)
let isConnected = false;
const connectDB = async () => {
    if (!isConnected) {
        try {
            await (0, database_1.connectDatabase)();
            isConnected = true;
        }
        catch (error) {
            console.error('Database connection error:', error);
        }
    }
};
connectDB().catch(console.error);
exports.default = index_1.default;
