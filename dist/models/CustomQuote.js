"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomQuote = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CustomQuoteSchema = new mongoose_1.Schema({
    project_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    requested_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    client_email: { type: String },
    description: { type: String },
    estimated_budget: { type: Number },
    amount: { type: Number },
    delivery_timeline: { type: String, default: '30 days' },
    admin_notes: { type: String },
    status: {
        type: String,
        enum: ['pending', 'sent', 'accepted', 'rejected'],
        default: 'pending',
    },
    sent_at: { type: Date },
    accepted_at: { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
exports.CustomQuote = mongoose_1.default.model('CustomQuote', CustomQuoteSchema);
