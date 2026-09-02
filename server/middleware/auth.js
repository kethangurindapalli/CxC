import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    // Also check x-auth-token
    if (!token && req.headers['x-auth-token']) token = req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    // update lastActive lazily (don't await to avoid delay)
    User.findByIdAndUpdate(user._id, { lastActive: new Date() }).exec().catch(()=>{});
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};
