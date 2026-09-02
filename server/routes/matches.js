import express from 'express';
import { getMatches, getMatchesForProject } from '../controllers/matchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMatches);
router.get('/:projectId', authenticate, getMatchesForProject);

export default router;