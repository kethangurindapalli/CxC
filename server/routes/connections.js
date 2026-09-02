import express from 'express';
import { body } from 'express-validator';
import {
  sendConnectionRequest,
  getConnections,
  respondToConnection,
  removeConnection
} from '../controllers/connectionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, getConnections);

router.post('/', authenticate, [
  body('receiverId').isMongoId().withMessage('Valid user ID required')
], validate, sendConnectionRequest);

// Spec: PUT /api/connections/:id with action accept/reject
router.put('/:id', authenticate, [
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], validate, respondToConnection);

// Also support /:connectionId for compatibility
router.put('/:connectionId/compat', authenticate, respondToConnection);

router.delete('/:id', authenticate, removeConnection);
router.delete('/:connectionId/compat', authenticate, removeConnection);

export default router;
