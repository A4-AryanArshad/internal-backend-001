"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UploadController_1 = require("../controllers/UploadController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Configure multer for memory storage (images)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    },
});
// Configure multer for invoice documents (PDF, DOC, DOCX)
const uploadInvoice = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
        }
    },
});
// Upload image
router.post('/:projectId/image', validation_1.validateProjectId, upload.single('image'), UploadController_1.UploadController.uploadImage);
// Delete image (optional)
router.delete('/image/:publicId', UploadController_1.UploadController.deleteImage);
// Upload invoice document (collaborator)
router.post('/:projectId/invoice', validation_1.validateProjectId, auth_1.authenticate, uploadInvoice.single('invoice'), UploadController_1.UploadController.uploadInvoice);
// Serve invoice document with correct headers (proxy endpoint)
router.get('/:projectId/invoice', validation_1.validateProjectId, auth_1.authenticate, UploadController_1.UploadController.serveInvoice);
// Upload monthly combined invoice
router.post('/monthly-invoice', auth_1.authenticate, uploadInvoice.single('invoice'), UploadController_1.UploadController.uploadMonthlyInvoice);
exports.default = router;
