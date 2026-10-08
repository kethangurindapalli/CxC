import express from 'express';
import { uploadProfilePicture, uploadMiddleware } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/profile-picture', authenticate, uploadMiddleware, uploadProfilePicture);

export default router;