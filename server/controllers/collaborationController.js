import Collaboration from '../models/Collaboration.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const sendCollaborationRequest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message, type } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot request to join your own project' });
    }

    const existing = await Collaboration.findOne({
      project: projectId,
      user: userId,
      type: type || 'collaboration_request'
    });
    if (existing) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    const collaboration = await Collaboration.create({
      project: projectId,
      user: userId,
      type: type || 'collaboration_request',
      message: message || '',
      status: 'pending'
    });

    await collaboration.populate('user', 'name profilePicture skills interests');
    await collaboration.populate('project', 'title');

    // Notify project owner
    const notification = await Notification.create({
      user: project.owner,
      type: type === 'join_request' ? 'project_join_request' : 'project_collaboration_request',
      title: type === 'join_request' ? 'Wants to join project' : 'Collaboration request',
      message: `${req.user.name} sent a ${type === 'join_request' ? 'join' : 'collaboration'} request for "${project.title}"`,
      relatedUser: userId,
      relatedProject: projectId
    });
    await notification.populate('relatedUser', 'name profilePicture');
    req.io?.to(project.owner.toString()).emit('notification', notification);

    res.status(201).json({ success: true, collaboration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getCollaborationRequests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can view requests' });
    }

    const requests = await Collaboration.find({ project: projectId, status: 'pending' })
      .populate('user', 'name bio profilePicture skills interests availability anonymousMode')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyCollaborationRequests = async (req, res) => {
  try {
    const requests = await Collaboration.find({ user: req.user._id })
      .populate('project', 'title category technologies currentProblem visibility owner')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const respondToCollaboration = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

    const collaboration = await Collaboration.findById(id).populate('project').populate('user');
    if (!collaboration) return res.status(404).json({ message: 'Request not found' });
    if (collaboration.project.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only project owner can respond' });
    }
    if (collaboration.status !== 'pending') {
      return res.status(400).json({ message: 'Request already responded to' });
    }

    collaboration.status = action === 'accept' ? 'accepted' : 'rejected';
    collaboration.respondedAt = new Date();
    await collaboration.save();

    // Notify requester
    const notification = await Notification.create({
      user: collaboration.user._id,
      type: action === 'accept'
        ? (collaboration.type === 'join_request' ? 'project_join_accepted' : 'project_collaboration_accepted')
        : 'connection_rejected',
      title: action === 'accept' ? 'Request accepted' : 'Request declined',
      message: `${req.user.name} ${action === 'accept' ? 'accepted' : 'declined'} your request for "${collaboration.project.title}"`,
      relatedUser: userId,
      relatedProject: collaboration.project._id
    });
    await notification.populate('relatedUser', 'name profilePicture');
    req.io?.to(collaboration.user._id.toString()).emit('notification', notification);

    res.json({ success: true, collaboration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeCollaboration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const collaboration = await Collaboration.findById(id).populate('project');
    if (!collaboration) return res.status(404).json({ message: 'Not found' });

    const isOwner = collaboration.project.owner.toString() === userId.toString();
    const isUser = collaboration.user.toString() === userId.toString();
    if (!isOwner && !isUser) return res.status(403).json({ message: 'Unauthorized' });

    await Collaboration.findByIdAndDelete(id);
    res.json({ success: true, message: 'Request removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};