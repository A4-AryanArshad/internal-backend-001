import mongoose, { Schema, Document } from 'mongoose'

export interface ICustomQuote extends Document {
  project_id?: mongoose.Types.ObjectId // Optional - can be created without project initially
  requested_by?: mongoose.Types.ObjectId // User who requested (optional if client_email is provided)
  client_email?: string // Client email for standalone requests
  description?: string // Client's description of what they want
  estimated_budget?: number // Client's estimated budget
  amount?: number // Admin-set price
  delivery_timeline?: string
  admin_notes?: string
  status: 'pending' | 'sent' | 'accepted' | 'rejected'
  sent_at?: Date
  accepted_at?: Date
  created_at: Date
  updated_at: Date
}

const CustomQuoteSchema = new Schema<ICustomQuote>(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project' },
    requested_by: { type: Schema.Types.ObjectId, ref: 'User' },
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export const CustomQuote = mongoose.model<ICustomQuote>('CustomQuote', CustomQuoteSchema)


