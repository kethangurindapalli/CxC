import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';

const userSockets = new Map();

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
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    socket.on('disconnect', () => {
      userSockets.delete(userId);
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
        // Only accepted connections can chat
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
        // Emit once to each user (avoids duplicate when also in room)
        io.to(receiverId.toString()).emit('newMessage', newMessage);
        io.to(userId.toString()).emit('newMessage', newMessage);
        io.to(receiverId.toString()).emit('conversationUpdate', newMessage);
        io.to(userId.toString()).emit('conversationUpdate', newMessage);
      } catch (e) {
        socket.emit('error', { message: 'Failed to send message' });
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
