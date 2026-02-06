import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();
const financeRoles = ['scholarship_staff', 'finance', 'scholarship_manager', 'admin', 'superadmin'];

router.use(requireAuth);
router.use(requireRole(...financeRoles));

// Get eligible applications for payment
router.get('/eligible', paymentController.getEligible);

// Generate payment batch
router.post('/batch', paymentController.generateBatch);

// List all batches
router.get('/batches', paymentController.getBatches);

// Get batch details
router.get('/batches/:id', paymentController.getBatchDetails);

// Confirm batch as paid
router.post('/batches/:id/confirm', paymentController.confirmBatch);

// Duplicate bank account detection
router.get('/duplicates', paymentController.getDuplicates);

export default router;
