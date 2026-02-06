import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();
const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin'];
const managerRoles = ['scholarship_manager', 'admin', 'superadmin'];

// All routes require auth + staff role
router.use(requireAuth);
router.use(requireRole(...staffRoles));

// UC-STAFF-01: Work Queue
router.get('/queue', staffController.getWorkQueue);

// UC-STAFF-08: Dashboard Stats
router.get('/dashboard', staffController.getDashboardStats);

// UC-STAFF-09: Reports
router.get('/reports', staffController.generateReport);

// Staff members list (for assignment)
router.get('/members', staffController.getStaffMembers);

// Correspondence templates
router.get('/templates', staffController.getTemplates);

// UC-STAFF-06: Rank Applications
router.get('/rankings/:scholarshipId', staffController.getRankedApplications);

// UC-STAFF-07: Bulk assign
router.post('/bulk-assign', staffController.bulkAssign);

// UC-STAFF-02: Review Application
router.get('/applications/:id', staffController.getApplicationForReview);

// UC-STAFF-02: Add review notes
router.post('/applications/:id/notes', staffController.addReviewNotes);

// UC-STAFF-03: MI Letter
router.post('/applications/:id/mi-letter', staffController.generateMILetter);

// UC-STAFF-04: Approve
router.post('/applications/:id/approve', staffController.approveApplication);

// UC-STAFF-05: Reject
router.post('/applications/:id/reject', staffController.rejectApplication);

// UC-STAFF-07: Assign
router.post('/applications/:id/assign', staffController.assignApplication);

export default router;
