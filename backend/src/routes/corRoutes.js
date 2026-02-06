import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as corController from '../controllers/corController.js';

const router = express.Router();
const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin'];

// Public endpoint: Institution responds to COR request via token
router.post('/respond/:token', corController.processCORResponse);

// Get COR response form data (public, for institution portal)
router.get('/respond/:token', async (req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database.js');
    const result = await dbQuery(
      `SELECT cr.institution_name, cr.applicant_name, cr.program,
              cr.enrollment_status, cr.year_of_study, cr.custom_message,
              cr.status, cr.created_at, a.reference_number
       FROM ae_scholarships.cor_requests cr
       JOIN ae_scholarships.applications a ON a.id = cr.application_id
       WHERE cr.response_token = $1`,
      [req.params.token]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'COR request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load COR request' });
  }
});

// Staff-only routes
router.use(requireAuth);
router.use(requireRole(...staffRoles));

// Check COR for an application (trigger SFS check)
router.post('/check/:id', corController.checkCOR);

// Send COR request to institution
router.post('/request/:id', corController.sendCORRequest);

// Get COR status for an application
router.get('/status/:id', corController.getCORStatus);

// List pending COR requests
router.get('/pending', corController.getPendingCORRequests);

// List all COR requests (with filters)
router.get('/all', corController.getAllCORRequests);

export default router;
