import mongoose, { Schema, Document } from 'mongoose'

export interface ICollaborator extends Document {
  first_name: string
  last_name: string
  email: string
  user_id: mongoose.Types.ObjectId
  // Stripe Connect fields
  stripe_account_id?: string
  payouts_enabled?: boolean
  charges_enabled?: boolean
  // Invoice type preference
  invoice_type?: 'per-project' | 'monthly' // Default: 'per-project'
  created_at: Date
  updated_at: Date
}

const CollaboratorSchema = new Schema<ICollaborator>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripe_account_id: { type: String },
    payouts_enabled: { type: Boolean, default: false },
    charges_enabled: { type: Boolean, default: false },
    invoice_type: { type: String, enum: ['per-project', 'monthly'], default: 'per-project' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export const Collaborator = mongoose.model<ICollaborator>('Collaborator', CollaboratorSchema)



