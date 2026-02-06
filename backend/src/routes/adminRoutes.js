import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();
const adminRoles = ['admin', 'superadmin'];

router.use(requireAuth);
router.use(requireRole(...adminRoles));

// UC-ADMIN-01: Scholarship Management
router.get('/scholarships', adminController.getScholarships);
router.get('/scholarships/lookups', adminController.getScholarshipLookups);
router.get('/scholarships/:id', adminController.getScholarshipById);
router.post('/scholarships', adminController.createScholarship);
router.put('/scholarships/:id', adminController.updateScholarship);

// UC-ADMIN-02: User Management
router.get('/users', adminController.getUsers);
router.get('/users/roles', adminController.getRoles);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/block', adminController.toggleUserBlock);

// UC-ADMIN-03: Legacy Imports
router.get('/legacy/imports', adminController.getLegacyImports);
router.post('/legacy/import', adminController.importLegacySubmissions);

// UC-AUDIT-01: Audit Trail (also accessible to managers)
router.get('/audit', adminController.getAuditLogs);
router.get('/audit/actions', adminController.getAuditActions);
router.get('/audit/export', adminController.exportAuditLogs);

// UC-INT-01: SFS Sync
router.post('/sfs/sync', adminController.syncWithSFS);

export default router;
