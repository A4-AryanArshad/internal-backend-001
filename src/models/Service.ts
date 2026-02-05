import mongoose, { Schema, Document } from 'mongoose'

export interface IService extends Document {
  name: string
  description: string
  price: number
  delivery_timeline: string // e.g., "7-14 days", "2-3 weeks"
  is_active: boolean
  created_at: Date
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    delivery_timeline: { type: String, default: '30 days' },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
)

export const Service = mongoose.model<IService>('Service', ServiceSchema)
