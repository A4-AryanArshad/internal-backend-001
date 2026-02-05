import { Router } from 'express'
import { UploadController } from '../controllers/UploadController'
import { validateProjectId } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import multer from 'multer'

const router = Router()

// Configure multer for memory storage (images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  },
})

// Configure multer for invoice documents (PDF, DOC, DOCX)
const uploadInvoice = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'))
    }
  },
})

// Upload image
router.post(
  '/:projectId/image',
  validateProjectId,
  upload.single('image'),
  UploadController.uploadImage
)

// Delete image (optional)
router.delete(
  '/image/:publicId',
  UploadController.deleteImage
)

// Upload invoice document (collaborator)
router.post(
  '/:projectId/invoice',
  validateProjectId,
  authenticate,
  uploadInvoice.single('invoice'),
  UploadController.uploadInvoice
)

// Serve invoice document with correct headers (proxy endpoint)
router.get(
  '/:projectId/invoice',
  validateProjectId,
  authenticate,
  UploadController.serveInvoice
)

// Upload monthly combined invoice
router.post(
  '/monthly-invoice',
  authenticate,
  uploadInvoice.single('invoice'),
  UploadController.uploadMonthlyInvoice
)

export default router
