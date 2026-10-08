import express from 'express';
import { getMatches, getMatchesForProject, recomputeMatches } from '../controllers/matchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMatches);
router.get('/:projectId', authenticate, getMatchesForProject);
router.post('/recompute', authenticate, recomputeMatches);

export default router;