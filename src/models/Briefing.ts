import mongoose, { Schema, Document } from 'mongoose'

export interface IBriefingImage extends Document {
  project_id: mongoose.Types.ObjectId
  image_url: string
  notes?: string
  order: number
  created_at: Date
}

export interface IProjectBriefing extends Document {
  project_id: mongoose.Types.ObjectId
  overall_description?: string
  submitted_at?: Date
  created_at: Date
  updated_at: Date
}

const BriefingImageSchema = new Schema<IBriefingImage>(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    image_url: { type: String, required: true },
    notes: { type: String },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
)

const ProjectBriefingSchema = new Schema<IProjectBriefing>(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    overall_description: { type: String },
    submitted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

export const BriefingImage = mongoose.model<IBriefingImage>('BriefingImage', BriefingImageSchema)
export const ProjectBriefing = mongoose.model<IProjectBriefing>('ProjectBriefing', ProjectBriefingSchema)




















