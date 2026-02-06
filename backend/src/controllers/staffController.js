import * as staffService from '../services/staffService.js';

// UC-STAFF-01: Work Queue
export async function getWorkQueue(req, res) {
  try {
    const { status, scholarship_id, reviewer_id, search, sort_by, sort_dir, page, limit } = req.query;
    const result = await staffService.getWorkQueue({
      status, scholarshipId: scholarship_id, reviewerId: reviewer_id, search,
      sortBy: sort_by, sortDir: sort_dir,
      page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 25, 100)
    });
    res.json(result);
  } catch (err) {
    console.error('Work queue error:', err);
    res.status(500).json({ message: 'Failed to load work queue' });
  }
}

// UC-STAFF-02: Review Application
export async function getApplicationForReview(req, res) {
  try {
    const app = await staffService.getApplicationForReview(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Failed to load application' });
  }
}

// UC-STAFF-02: Add review notes
export async function addReviewNotes(req, res) {
  try {
    const { notes } = req.body;
    if (!notes || !notes.trim()) return res.status(400).json({ message: 'Notes are required' });
    const result = await staffService.addReviewNotes(req.params.id, req.user.id, notes.trim());
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-03: Generate MI Letter
export async function generateMILetter(req, res) {
  try {
    const { reasons, custom_message } = req.body;
    if (!reasons || reasons.length === 0) return res.status(400).json({ message: 'At least one reason is required' });
    const result = await staffService.generateMILetter(req.params.id, req.user.id, { reasons, customMessage: custom_message });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-04: Approve
export async function approveApplication(req, res) {
  try {
    const result = await staffService.approveApplication(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-05: Reject
export async function rejectApplication(req, res) {
  try {
    const { reasons, notes } = req.body;
    if (!reasons || reasons.length === 0) return res.status(400).json({ message: 'At least one reason is required' });
    const result = await staffService.rejectApplication(req.params.id, req.user.id, { reasons, notes });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-06: Rank Applications
export async function getRankedApplications(req, res) {
  try {
    const result = await staffService.getRankedApplications(req.params.scholarshipId);
    res.json(result);
  } catch (err) {
    console.error('Ranking error:', err);
    res.status(500).json({ message: 'Failed to load rankings' });
  }
}

// UC-STAFF-07: Assign
export async function assignApplication(req, res) {
  try {
    const { assignee_id } = req.body;
    if (!assignee_id) return res.status(400).json({ message: 'Assignee ID is required' });
    const result = await staffService.assignApplication(req.params.id, req.user.id, assignee_id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-07: Bulk assign
export async function bulkAssign(req, res) {
  try {
    const { application_ids, assignee_id } = req.body;
    if (!application_ids?.length || !assignee_id) return res.status(400).json({ message: 'Application IDs and assignee required' });
    const results = await staffService.bulkAssign(application_ids, req.user.id, assignee_id);
    res.json({ updated: results.length, results });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-STAFF-08: Dashboard
export async function getDashboardStats(req, res) {
  try {
    const stats = await staffService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
}

// UC-STAFF-09: Reports
export async function generateReport(req, res) {
  try {
    const { start_date, end_date, scholarship_id, status } = req.query;
    const result = await staffService.generateReport({
      startDate: start_date, endDate: end_date,
      scholarshipId: scholarship_id, status
    });
    res.json(result);
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
}

// Staff members list
export async function getStaffMembers(req, res) {
  try {
    const result = await staffService.getStaffMembers();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load staff members' });
  }
}

// Correspondence templates
export async function getTemplates(req, res) {
  try {
    const templates = await staffService.getCorrespondenceTemplates(req.query.type);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load templates' });
  }
}
