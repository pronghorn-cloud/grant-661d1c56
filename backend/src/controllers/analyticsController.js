import * as analyticsService from '../services/analyticsService.js';

export async function getDashboard(req, res) {
  try {
    const result = await analyticsService.getAnalyticsDashboard();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}
