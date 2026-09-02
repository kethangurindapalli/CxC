import User from '../models/User.js';
import Project from '../models/Project.js';
import Connection from '../models/Connection.js';

const toPublicUser = (user, requesterId) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.email;
  // Anonymous handling
  if (obj.anonymousMode) {
    const anonId = obj._id.toString().slice(-4);
    return {
      _id: obj._id,
      name: `Anonymous User #${anonId}`,
      bio: '',
      skills: obj.skills,
      interests: obj.interests,
      availability: obj.activityVisibility ? obj.availability : undefined,
      anonymousMode: true,
      lastActive: obj.activityVisibility ? obj.lastActive : undefined,
      profilePicture: '',
      createdAt: obj.createdAt
    };
  }
  // Hide lastActive if activityVisibility false and not self
  if (!obj.activityVisibility && requesterId?.toString() !== obj._id.toString()) {
    delete obj.lastActive;
  }
  delete obj.password;
  delete obj.email;
  return {
    _id: obj._id,
    name: obj.name,
    bio: obj.bio,
    skills: obj.skills,
    interests: obj.interests,
    availability: obj.availability,
    anonymousMode: false,
    activityVisibility: obj.activityVisibility,
    lastActive: obj.lastActive,
    profilePicture: obj.profilePicture,
    createdAt: obj.createdAt
  };
};

export const searchUsers = async (req, res) => {
  try {
    const { q, skills, interests } = req.query;
    const currentUserId = req.user._id;
    let query = { _id: { $ne: currentUserId } };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } }
      ];
    }
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
    }
    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim());
      query.interests = { $in: interestArray.map(s => new RegExp(s, 'i')) };
    }
    const users = await User.find(query).limit(20);
    const publicUsers = users.map(u => toPublicUser(u, currentUserId));
    res.json({ success: true, users: publicUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if requester is connected to see connection-only projects
    const isSelf = req.user._id.toString() === user._id.toString();
    let isConnected = false;
    if (!isSelf) {
      const conn = await Connection.findOne({
        $or: [
          { sender: req.user._id, receiver: user._id, status: 'accepted' },
          { sender: user._id, receiver: req.user._id, status: 'accepted' }
        ]
      });
      isConnected = !!conn;
    }

    let projectQuery = { owner: user._id };
    if (!isSelf && !isConnected) {
      projectQuery.visibility = 'Public';
    } else if (!isSelf && isConnected) {
      projectQuery.visibility = { $in: ['Public', 'Connections Only'] };
    }
    // Self sees all, connected sees public+connections, others only public. Private never shown to others.
    if (!isSelf) {
      // already filtered above, but ensure private not included
    }

    const projects = await Project.find(projectQuery).select('title description category technologies currentProblem status visibility createdAt');
    // For anonymous users, hide detailed project info for non-connected
    let filteredProjects = projects;
    if (user.anonymousMode && !isSelf) {
      filteredProjects = projects.map(p => ({
        _id: p._id,
        title: p.category,
        description: '',
        category: p.category,
        technologies: p.technologies?.slice(0,2) || [],
        currentProblem: '',
        status: p.status,
        visibility: p.visibility,
        createdAt: p.createdAt
      }));
    }

    res.json({ success: true, user: toPublicUser(user, req.user._id), projects: filteredProjects, isConnected, isSelf });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, interests, availability, anonymousMode, activityVisibility, profilePicture } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (skills !== undefined) update.skills = skills;
    if (interests !== undefined) update.interests = interests;
    if (availability !== undefined) update.availability = availability;
    if (anonymousMode !== undefined) update.anonymousMode = anonymousMode;
    if (activityVisibility !== undefined) update.activityVisibility = activityVisibility;
    if (profilePicture !== undefined) update.profilePicture = profilePicture;
    update.lastActive = new Date();
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
