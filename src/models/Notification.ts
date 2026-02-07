import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId // User (admin) who receives this
  type: 'invoice_uploaded' | 'monthly_invoice_uploaded'
  read: boolean
  data: {
    projectId?: string
    projectName?: string
    collaboratorName?: string
    month?: string
    projectsCount?: number
  }
  created_at: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['invoice_uploaded', 'monthly_invoice_uploaded'],
      required: true,
    },
    read: { type: Boolean, default: false },
    data: {
      projectId: String,
      projectName: String,
      collaboratorName: String,
      month: String,
      projectsCount: Number,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
)

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
