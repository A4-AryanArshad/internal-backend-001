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
exports.Project = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    client_name: { type: String, required: true },
    client_email: { type: String },
    client_user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    project_type: {
        type: String,
        enum: ['simple', 'custom'],
        default: 'simple',
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'review', 'completed', 'revision'],
        default: 'pending',
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    stripe_payment_id: { type: String },
    selected_service: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service' },
    service_name: { type: String },
    service_price: { type: Number },
    custom_quote_amount: { type: Number },
    custom_quote_request: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CustomQuote' },
    custom_quote_description: { type: String },
    delivery_timeline: { type: String },
    assigned_collaborator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Collaborator' },
    collaborator_payment_amount: { type: Number },
    collaborator_paid: { type: Boolean, default: false },
    collaborator_paid_at: { type: Date },
    collaborator_transfer_id: { type: String },
    invoice_url: { type: String },
    invoice_public_id: { type: String },
    invoice_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    invoice_uploaded_at: { type: Date },
    invoice_approved_at: { type: Date },
    invoice_type: { type: String, enum: ['per-project', 'monthly'] },
    monthly_invoice_id: { type: String }, // Groups projects in the same monthly invoice
    monthly_invoice_month: { type: String }, // Format: "YYYY-MM"
    revisions_used: { type: Number, default: 0 },
    max_revisions: { type: Number, default: 3 },
    completed_at: { type: Date }, // Track when project was completed
    status_notes: {
        type: Map,
        of: String,
    },
    deadline: { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
exports.Project = mongoose_1.default.model('Project', ProjectSchema);
