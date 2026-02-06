import * as corService from '../services/corService.js';

// UC-COR-01: Check/trigger COR check for an application
export async function checkCOR(req, res) {
  try {
    const result = await corService.checkExistingCOR(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-COR-02: Send COR request to institution
export async function sendCORRequest(req, res) {
  try {
    const { institution_email, custom_message } = req.body;
    const result = await corService.sendCORRequest(req.params.id, req.user.id, {
      institution_email, custom_message
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// UC-COR-03: Process COR response from institution (public endpoint with token)
export async function processCORResponse(req, res) {
  try {
    const { token } = req.params;
    const { status, confirmed_by, notes } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const result = await corService.processCORResponse(token, { status, confirmed_by, notes });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// Get COR status for an application
export async function getCORStatus(req, res) {
  try {
    const result = await corService.getCORStatus(req.params.id);
    if (!result) return res.status(404).json({ message: 'Application not found' });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// Get pending COR requests (staff)
export async function getPendingCORRequests(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await corService.getPendingCORRequests({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 25, 100)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load COR requests' });
  }
}

// Get all COR requests (staff reporting)
export async function getAllCORRequests(req, res) {
  try {
    const { status, institution, page, limit } = req.query;
    const result = await corService.getAllCORRequests({
      status, institution,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 25, 100)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load COR requests' });
  }
}
