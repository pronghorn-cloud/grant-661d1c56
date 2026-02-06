import express from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public auth routes
router.post('/aca', authController.loginWithACA);
router.post('/microsoft', authController.loginWithMicrosoft);

// Dev login (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', authController.devLogin);
}

// Protected auth routes
router.get('/me', requireAuth, authController.getMe);
router.post('/refresh', requireAuth, authController.refreshToken);
router.post('/logout', requireAuth, authController.logout);

export default router;
