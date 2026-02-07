"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
let stripeInstance = null;
const getStripe = () => {
    if (!stripeInstance) {
        // Hardcoded Stripe secret key
        const STRIPE_SECRET_KEY = 'sk_test_51Rj1dnBOoulucdCvbGDz4brJYHztkuL80jGSKcnQNT46g9P58pbxY36Lg3yWyMDb6Gwgv5Rr3NDfjvB2HyaDlJP7006wnXEtp1';
        stripeInstance = new stripe_1.default(STRIPE_SECRET_KEY, {
            apiVersion: '2025-12-15.clover',
        });
    }
    return stripeInstance;
};
exports.getStripe = getStripe;
