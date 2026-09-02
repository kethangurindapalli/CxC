import express from 'express';
import { body } from 'express-validator';
import {
  getMessages,
  getConversations,
  sendMessage
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.get('/:userId', authenticate, getMessages);

router.post('/', authenticate, [
  body('receiverId').isMongoId().withMessage('Valid user ID required'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message too long')
], validate, sendMessage);

export default router;