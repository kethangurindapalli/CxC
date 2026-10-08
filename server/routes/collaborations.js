import express from 'express';
import { body } from 'express-validator';
import {
  sendCollaborationRequest,
  getCollaborationRequests,
  getMyCollaborationRequests,
  respondToCollaboration,
  removeCollaboration
} from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Send collaboration/join request to a project
router.post('/projects/:projectId', authenticate, [
  body('type').optional().isIn(['join_request', 'collaboration_request']).withMessage('Invalid type'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
], validate, sendCollaborationRequest);

// Get pending requests for a project (owner only)
router.get('/projects/:projectId', authenticate, getCollaborationRequests);

// Get my sent requests
router.get('/my', authenticate, getMyCollaborationRequests);

// Respond to a request (accept/reject)
router.put('/:id', authenticate, [
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], validate, respondToCollaboration);

// Remove a request
router.delete('/:id', authenticate, removeCollaboration);

export default router;