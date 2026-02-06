import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import * as applicationController from '../controllers/applicationController.js';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const appDir = path.join(uploadsDir, req.params.id || 'temp');
    if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
    cb(null, appDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: PDF, DOCX, JPG, PNG'));
    }
  }
});

// Application routes (all authenticated)
router.post('/', requireAuth, applicationController.startApplication);
router.get('/my', requireAuth, applicationController.getMyApplications);
router.get('/:id', requireAuth, applicationController.getApplication);
router.put('/:id', requireAuth, applicationController.saveDraft);
router.post('/:id/submit', requireAuth, applicationController.submitApplication);
router.post('/:id/withdraw', requireAuth, applicationController.withdrawApplication);
router.post('/:id/respond-mi', requireAuth, applicationController.respondToMI);

// Document routes
router.post('/:id/documents', requireAuth, upload.single('file'), applicationController.uploadDocument);
router.delete('/:id/documents/:docId', requireAuth, applicationController.removeDocument);

export default router;
