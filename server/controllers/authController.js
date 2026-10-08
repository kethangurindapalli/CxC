import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
  res.cookie('token', token, cookieOptions);
  // Also return token for Socket.IO usage
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      skills: user.skills,
      interests: user.interests,
      profilePicture: user.profilePicture,
      availability: user.availability,
      anonymousMode: user.anonymousMode,
      activityVisibility: user.activityVisibility,
      lastActive: user.lastActive
    }
  });
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    // update lastActive
    user.lastActive = new Date();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // update lastActive
    if (user) {
      user.lastActive = new Date();
      await user.save();
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, interests, profilePicture, availability, anonymousMode, activityVisibility } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (skills !== undefined) update.skills = skills;
    if (interests !== undefined) update.interests = interests;
    if (profilePicture !== undefined) update.profilePicture = profilePicture;
    if (availability !== undefined) update.availability = availability;
    if (anonymousMode !== undefined) update.anonymousMode = anonymousMode;
    if (activityVisibility !== undefined) update.activityVisibility = activityVisibility;
    update.lastActive = new Date();

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link will be sent' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    // In production, send email with resetToken. For demo, return token.
    res.json({ success: true, message: 'If the email exists, a reset link will be sent', resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
