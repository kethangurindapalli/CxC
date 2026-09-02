import Connection from '../models/Connection.js';
import User from '../models/User.js';

export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    if (senderId.toString() === receiverId) return res.status(400).json({ message: 'Cannot connect to yourself' });
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });
    if (existingConnection) return res.status(400).json({ message: 'Connection already exists or pending' });
    const connection = await Connection.create({ sender: senderId, receiver: receiverId, status: 'pending' });
    await connection.populate('sender', 'name profilePicture availability');
    await connection.populate('receiver', 'name profilePicture availability');
    req.io?.to(receiverId.toString()).emit('connectionRequest', connection);
    res.status(201).json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const pending = await Connection.find({ receiver: userId, status: 'pending' })
      .populate('sender', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive')
      .sort({ createdAt: -1 });
    const sent = await Connection.find({ sender: userId, status: 'pending' })
      .populate('receiver', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive')
      .sort({ createdAt: -1 });
    const accepted = await Connection.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    })
      .populate('sender', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive')
      .populate('receiver', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive')
      .sort({ updatedAt: -1 });

    // Anonymize if needed
    const anonymize = (u) => {
      if (!u) return u;
      if (u.anonymousMode) {
        const anonId = u._id.toString().slice(-4);
        return { _id: u._id, name: `Anonymous User #${anonId}`, bio: '', skills: u.skills, interests: u.interests, profilePicture: '', availability: u.activityVisibility ? u.availability : undefined, anonymousMode: true, lastActive: u.activityVisibility ? u.lastActive : undefined };
      }
      if (!u.activityVisibility) {
        const obj = u.toObject ? u.toObject() : { ...u };
        delete obj.lastActive;
        return obj;
      }
      return u;
    };

    const pendingAnon = pending.map(c => { c.sender = anonymize(c.sender); return c; });
    const sentAnon = sent.map(c => { c.receiver = anonymize(c.receiver); return c; });
    const acceptedAnon = accepted.map(c => { c.sender = anonymize(c.sender); c.receiver = anonymize(c.receiver); return c; });

    res.json({ success: true, pending: pendingAnon, sent: sentAnon, accepted: acceptedAnon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const respondToConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const id = connectionId || req.params.id;
    const { action } = req.body;
    const userId = req.user._id;
    const connection = await Connection.findById(id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    if (connection.receiver.toString() !== userId.toString()) return res.status(403).json({ message: 'Unauthorized' });
    if (connection.status !== 'pending') return res.status(400).json({ message: 'Connection already responded to' });
    if (action === 'accept') connection.status = 'accepted';
    else if (action === 'reject') connection.status = 'rejected';
    else return res.status(400).json({ message: 'Invalid action' });
    await connection.save();
    await connection.populate('sender', 'name profilePicture');
    await connection.populate('receiver', 'name profilePicture');
    req.io?.to(connection.sender._id.toString()).emit('connectionResponse', connection);
    res.json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const id = connectionId || req.params.id;
    const userId = req.user._id;
    const connection = await Connection.findById(id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    const isSender = connection.sender.toString() === userId.toString();
    const isReceiver = connection.receiver.toString() === userId.toString();
    if (!isSender && !isReceiver) return res.status(403).json({ message: 'Unauthorized' });

    // Allow cancel if pending and requester is sender, or remove if accepted
    if (connection.status === 'pending') {
      if (!isSender) return res.status(403).json({ message: 'Only sender can cancel pending request' });
      await Connection.findByIdAndDelete(id);
      const otherUserId = connection.receiver;
      req.io?.to(otherUserId.toString()).emit('connectionRemoved', { connectionId: id, removedBy: userId });
      return res.json({ success: true, message: 'Connection request cancelled' });
    }
    if (connection.status === 'accepted') {
      await Connection.findByIdAndDelete(id);
      const otherUserId = isSender ? connection.receiver : connection.sender;
      req.io?.to(otherUserId.toString()).emit('connectionRemoved', { connectionId: id, removedBy: userId });
      return res.json({ success: true, message: 'Connection removed' });
    }
    // rejected - allow delete by either to clean up
    await Connection.findByIdAndDelete(id);
    res.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const cancelRequest = async (req, res) => {
  return removeConnection(req, res);
};
