import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();
const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];

router.use(requireAuth);
router.use(requireRole(...staffRoles));

router.get('/dashboard', analyticsController.getDashboard);

export default router;
