import express from 'express';
import authRoutes from './authRoutes.js';
import scholarshipRoutes from './scholarshipRoutes.js';
import profileRoutes from './profileRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import staffRoutes from './staffRoutes.js';
import corRoutes from './corRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Scholarship routes
router.use('/scholarships', scholarshipRoutes);

// Profile, banking, and lookup routes
router.use('/profile', profileRoutes);

// Application routes
router.use('/applications', applicationRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Staff/Admin routes
router.use('/staff', staffRoutes);

// COR (Confirmation of Registration) routes
router.use('/cor', corRoutes);

// Payment processing routes
router.use('/payments', paymentRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AE Scholarships API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
