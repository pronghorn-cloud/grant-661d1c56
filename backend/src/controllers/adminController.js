import * as adminService from '../services/adminService.js';

// UC-ADMIN-01: Scholarship Management
export async function getScholarships(req, res) {
  try {
    const result = await adminService.getScholarships(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getScholarshipById(req, res) {
  try {
    const result = await adminService.getScholarshipById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Scholarship not found' });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function createScholarship(req, res) {
  try {
    const result = await adminService.createScholarship(req.body, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function updateScholarship(req, res) {
  try {
    const result = await adminService.updateScholarship(req.params.id, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getScholarshipLookups(req, res) {
  try {
    const result = await adminService.getScholarshipLookups();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-ADMIN-02: User Management
export async function getUsers(req, res) {
  try {
    const result = await adminService.getUsers(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getUserById(req, res) {
  try {
    const result = await adminService.getUserById(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function updateUserRole(req, res) {
  try {
    const result = await adminService.updateUserRole(req.params.id, req.body.role, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function toggleUserBlock(req, res) {
  try {
    const result = await adminService.toggleUserBlock(req.params.id, req.body.blocked, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getRoles(req, res) {
  try {
    const result = await adminService.getRoles();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-ADMIN-03: Legacy Imports
export async function getLegacyImports(req, res) {
  try {
    const result = await adminService.getLegacyImports(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function importLegacySubmissions(req, res) {
  try {
    const result = await adminService.importLegacySubmissions(req.body.submissions, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-AUDIT-01: Audit Trail
export async function getAuditLogs(req, res) {
  try {
    const result = await adminService.getAuditLogs(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getAuditActions(req, res) {
  try {
    const result = await adminService.getAuditActions();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function exportAuditLogs(req, res) {
  try {
    const csv = await adminService.exportAuditLogs(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-INT-01: SFS Sync
export async function syncWithSFS(req, res) {
  try {
    const result = await adminService.syncWithSFS(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}
