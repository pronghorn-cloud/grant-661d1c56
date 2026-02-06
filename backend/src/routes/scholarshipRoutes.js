import express from 'express';
import * as scholarshipController from '../controllers/scholarshipController.js';

const router = express.Router();

router.get('/', scholarshipController.getAll);
router.get('/types', scholarshipController.getTypes);
router.get('/categories', scholarshipController.getCategories);
router.get('/:id', scholarshipController.getById);

export default router;
