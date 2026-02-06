import * as scholarshipService from '../services/scholarshipService.js';

export async function getAll(req, res, next) {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      status: req.query.status || 'Active',
      search: req.query.search,
      academic_year: req.query.academic_year
    };

    const scholarships = await scholarshipService.getAll(filters);
    res.json({ success: true, data: scholarships, count: scholarships.length });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const scholarship = await scholarshipService.getById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }
    res.json({ success: true, data: scholarship });
  } catch (error) {
    next(error);
  }
}

export async function getTypes(req, res, next) {
  try {
    const types = await scholarshipService.getTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await scholarshipService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}
