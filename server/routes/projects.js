import express from 'express';
import { body } from 'express-validator';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getAllProjects,
  searchProjects
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, getProjects);
router.get('/all', authenticate, getAllProjects);
router.get('/search', authenticate, searchProjects);
router.get('/:id', authenticate, getProjectById);

router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title too long'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description too long'),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 50 }).withMessage('Category too long'),
  body('technologies').optional().isArray().withMessage('Technologies must be an array'),
  body('currentProblem').optional().isLength({ max: 1000 }).withMessage('Problem too long'),
  body('status').optional().isIn(['Active', 'Completed']).withMessage('Invalid status')
], validate, createProject);

router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title too long'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty').isLength({ max: 2000 }).withMessage('Description too long'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty').isLength({ max: 50 }).withMessage('Category too long'),
  body('technologies').optional().isArray().withMessage('Technologies must be an array'),
  body('currentProblem').optional().isLength({ max: 1000 }).withMessage('Problem too long'),
  body('status').optional().isIn(['Active', 'Completed']).withMessage('Invalid status')
], validate, updateProject);

router.delete('/:id', authenticate, deleteProject);

export default router;