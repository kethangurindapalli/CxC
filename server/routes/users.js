import express from 'express';
import { searchUsers, getUserById, getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', authenticate, searchUsers);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/:id', authenticate, getUserById);

export default router;
