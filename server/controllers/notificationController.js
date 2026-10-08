import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.read = false;
    const notifications = await Notification.find(query)
      .populate('relatedUser', 'name profilePicture')
      .populate('relatedProject', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createNotification = async (userId, type, title, message, relatedData = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      ...relatedData
    });
    await notification.populate('relatedUser', 'name profilePicture');
    await notification.populate('relatedProject', 'title');
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};