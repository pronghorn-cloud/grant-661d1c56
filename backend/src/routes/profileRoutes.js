import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as profileController from '../controllers/profileController.js';

const router = Router();

// Profile routes (authenticated)
router.get('/me', requireAuth, profileController.getProfile);
router.post('/me', requireAuth, profileController.createProfile);
router.put('/me', requireAuth, profileController.updateProfile);

// Banking info routes (authenticated)
router.get('/banking', requireAuth, profileController.getBankingInfo);
router.post('/banking', requireAuth, profileController.saveBankingInfo);

// Lookup routes (public)
router.get('/lookups/:table', profileController.getLookup);

export default router;
