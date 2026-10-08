import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import User from '../models/User.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary not configured' });
    }
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'cxc/profile-pictures',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.secure_url, lastActive: new Date() },
      { new: true }
    );
    res.json({ success: true, user, profilePicture: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

export const uploadMiddleware = upload.single('profilePicture');