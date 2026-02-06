import * as paymentService from '../services/paymentService.js';

// Get eligible applications for payment
export async function getEligible(req, res) {
  try {
    const apps = await paymentService.getEligibleApplications();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load eligible applications' });
  }
}

// Generate payment batch
export async function generateBatch(req, res) {
  try {
    const { application_ids } = req.body;
    if (!application_ids?.length) return res.status(400).json({ message: 'No applications selected' });
    const result = await paymentService.generatePaymentBatch(application_ids, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// Confirm batch payment
export async function confirmBatch(req, res) {
  try {
    const result = await paymentService.confirmBatchPayment(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

// List batches
export async function getBatches(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await paymentService.getPaymentBatches({
      page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 25, 100)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load batches' });
  }
}

// Get batch details
export async function getBatchDetails(req, res) {
  try {
    const result = await paymentService.getBatchDetails(req.params.id);
    if (!result) return res.status(404).json({ message: 'Batch not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load batch details' });
  }
}

// Get duplicate bank accounts
export async function getDuplicates(req, res) {
  try {
    const result = await paymentService.getDuplicateBankAccounts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to check duplicates' });
  }
}
