import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';

const userSockets = new Map();
const userOnlineStatus = new Map();

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    userSockets.set(userId, socket.id);
    userOnlineStatus.set(userId, true);
    socket.join(userId);
    io.emit('userOnline', { userId });
    console.log(`User connected: ${socket.user.name} (${userId})`);

    socket.on('disconnect', () => {
      userSockets.delete(userId);
      userOnlineStatus.set(userId, false);
      io.emit('userOffline', { userId, lastActive: new Date() });
      console.log(`User disconnected: ${socket.user.name} (${userId})`);
    });

    socket.on('joinConversation', (otherUserId) => {
      const room = [userId, otherUserId].sort().join('-');
      socket.join(room);
    });

    socket.on('leaveConversation', (otherUserId) => {
      const room = [userId, otherUserId].sort().join('-');
      socket.leave(room);
    });

    socket.on('sendMessage', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message?.trim()) {
          return socket.emit('error', { message: 'Invalid message' });
        }
        const connection = await Connection.findOne({
          $or: [
            { sender: userId, receiver: receiverId, status: 'accepted' },
            { sender: receiverId, receiver: userId, status: 'accepted' }
          ]
        });
        if (!connection) {
          return socket.emit('error', { message: 'Not connected to this user' });
        }
        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId,
          message: message.trim()
        });
        await newMessage.populate('sender', 'name profilePicture');
        await newMessage.populate('receiver', 'name profilePicture');

        io.to(receiverId.toString()).emit('newMessage', newMessage);
        io.to(userId.toString()).emit('newMessage', newMessage);
        io.to(receiverId.toString()).emit('conversationUpdate', newMessage);
        io.to(userId.toString()).emit('conversationUpdate', newMessage);

        // Create notification for receiver
        const notification = await Notification.create({
          user: receiverId,
          type: 'message',
          title: 'New message',
          message: `${socket.user.name}: ${message.trim().slice(0, 50)}${message.trim().length > 50 ? '...' : ''}`,
          relatedUser: userId,
          relatedMessage: newMessage._id
        });
        await notification.populate('relatedUser', 'name profilePicture');
        io.to(receiverId.toString()).emit('notification', notification);
      } catch (e) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markRead', async ({ messageId, otherUserId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { read: true });
        io.to(otherUserId.toString()).emit('messageRead', { messageId, readBy: userId });
      } catch (e) {
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    socket.on('typing', (otherUserId) => {
      const room = [userId, otherUserId].sort().join('-');
      socket.to(room).emit('userTyping', { userId, name: socket.user.name });
    });

    socket.on('stopTyping', (otherUserId) => {
      const room = [userId, otherUserId].sort().join('-');
      socket.to(room).emit('userStopTyping', { userId });
    });
  });

  return io;
};

export const getUserSocketId = (userId) => {
  return userSockets.get(userId.toString());
};

export const isUserOnline = (userId) => {
  return userOnlineStatus.get(userId.toString()) === true;
};

export const emitNotification = (io, userId, notification) => {
  io.to(userId.toString()).emit('notification', notification);
};

export const emitConnectionUpdate = (io, userId, connection) => {
  io.to(userId.toString()).emit('connectionUpdate', connection);
};