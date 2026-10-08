import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { sender: currentUserId, receiver: userId, status: 'accepted' },
        { sender: userId, receiver: currentUserId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'Not connected to this user' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .sort({ createdAt: 1 })
      .limit(100);

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    })
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture');

    const conversations = await Promise.all(connections.map(async (conn) => {
      const otherUser = conn.sender._id.toString() === userId.toString() ? conn.receiver : conn.sender;
      
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: otherUser._id },
          { sender: otherUser._id, receiver: userId }
        ]
      }).sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        receiver: userId,
        read: false
      });

      return {
        user: otherUser,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null,
        unreadCount
      };
    }));

    conversations.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || 0;
      const dateB = b.lastMessage?.createdAt || 0;
      return new Date(dateB) - new Date(dateA);
    });

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'accepted' },
        { sender: receiverId, receiver: senderId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'Not connected to this user' });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message
    });

    await newMessage.populate('sender', 'name profilePicture');
    await newMessage.populate('receiver', 'name profilePicture');

    req.io?.to(receiverId.toString()).emit('newMessage', newMessage);
    req.io?.to(senderId.toString()).emit('newMessage', newMessage);

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};