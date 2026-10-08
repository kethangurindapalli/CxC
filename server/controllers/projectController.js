import Project from '../models/Project.js';
import Connection from '../models/Connection.js';

const canViewProject = async (project, requesterId) => {
  if (!project) return false;
  if (project.owner.toString() === requesterId.toString()) return true;
  if (project.visibility === 'Private') return false;
  if (project.visibility === 'Public') return true;
  if (project.visibility === 'Connections Only') {
    const conn = await Connection.findOne({
      $or: [
        { sender: requesterId, receiver: project.owner, status: 'accepted' },
        { sender: project.owner, receiver: requesterId, status: 'accepted' }
      ]
    });
    return !!conn;
  }
  return false;
};

export const createProject = async (req, res) => {
  try {
    const { title, description, category, technologies, currentProblem, status, visibility } = req.body;
    const project = await Project.create({
      owner: req.user._id,
      title,
      description,
      category,
      technologies: technologies || [],
      currentProblem: currentProblem || '',
      status: status || 'Active',
      visibility: visibility || 'Public'
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;
    const projects = await Project.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Project.countDocuments(query);
    res.json({ success: true, projects, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email bio skills interests profilePicture availability anonymousMode activityVisibility lastActive');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const allowed = await canViewProject(project, req.user._id);
    if (!allowed) return res.status(403).json({ message: 'Not authorized to view this project' });

    // If owner is anonymous and requester not owner, anonymize
    if (project.owner.anonymousMode && project.owner._id.toString() !== req.user._id.toString()) {
      const anonId = project.owner._id.toString().slice(-4);
      project.owner.name = `Anonymous User #${anonId}`;
      project.owner.email = undefined;
      project.owner.bio = '';
      project.owner.profilePicture = '';
    } else {
      // never expose email
      project.owner.email = undefined;
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { title, description, category, technologies, currentProblem, status, visibility } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { title, description, category, technologies, currentProblem, status, visibility },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const { category, status = 'Active', page = 1, limit = 20 } = req.query;
    // Only show public projects + connections-only if connected
    // For simplicity, fetch public + connections-only where connected, then filter
    const connections = await Connection.find({
      $or: [{ sender: req.user._id, status: 'accepted' }, { receiver: req.user._id, status: 'accepted' }]
    });
    const connectedUserIds = connections.map(c => c.sender.toString() === req.user._id.toString() ? c.receiver.toString() : c.sender.toString());

    const query = { status };
    if (category) query.category = category;

    // Build visibility filter: public always visible, connections-only if owner is connected, private never, own projects excluded? Include but filtered via visibility. For discovery, exclude own.
    const projects = await Project.find({ ...query, owner: { $ne: req.user._id } })
      .populate('owner', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive')
      .sort({ createdAt: -1 })
      .limit(100);

    const filtered = projects.filter(p => {
      if (p.visibility === 'Private') return false;
      if (p.visibility === 'Public') return true;
      if (p.visibility === 'Connections Only') return connectedUserIds.includes(p.owner._id.toString());
      return true;
    }).slice((page - 1) * limit, page * limit);

    // Anonymize owners
    const anonymized = filtered.map(p => {
      const owner = p.owner;
      if (owner.anonymousMode) {
        const anonId = owner._id.toString().slice(-4);
        p.owner = { _id: owner._id, name: `Anonymous User #${anonId}`, bio: '', skills: owner.skills, interests: owner.interests, profilePicture: '', availability: owner.activityVisibility ? owner.availability : undefined, anonymousMode: true, lastActive: owner.activityVisibility ? owner.lastActive : undefined };
        // also hide detailed project for anonymous: show only category
        p.title = p.category;
        p.description = '';
        p.currentProblem = '';
      } else {
        // hide email, optionally hide lastActive
        if (!owner.activityVisibility) owner.lastActive = undefined;
      }
      return p;
    });

    res.json({ success: true, projects: anonymized, pagination: { page: parseInt(page), limit: parseInt(limit), total: filtered.length, pages: Math.ceil(filtered.length / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const searchProjects = async (req, res) => {
  try {
    const { q, technologies, category } = req.query;
    const connections = await Connection.find({
      $or: [{ sender: req.user._id, status: 'accepted' }, { receiver: req.user._id, status: 'accepted' }]
    });
    const connectedUserIds = connections.map(c => c.sender.toString() === req.user._id.toString() ? c.receiver.toString() : c.sender.toString());

    const query = { status: 'Active', owner: { $ne: req.user._id } };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { currentProblem: { $regex: q, $options: 'i' } }
      ];
    }
    if (technologies) {
      const techArray = technologies.split(',').map(t => t.trim());
      query.technologies = { $in: techArray.map(t => new RegExp(t, 'i')) };
    }
    if (category) query.category = category;

    let projects = await Project.find(query).populate('owner', 'name bio skills interests profilePicture availability anonymousMode activityVisibility lastActive').limit(50);

    projects = projects.filter(p => {
      if (p.visibility === 'Private') return false;
      if (p.visibility === 'Public') return true;
      if (p.visibility === 'Connections Only') return connectedUserIds.includes(p.owner._id.toString());
      return true;
    });

    projects = projects.map(p => {
      if (p.owner.anonymousMode) {
        const anonId = p.owner._id.toString().slice(-4);
        p.owner.name = `Anonymous User #${anonId}`;
        p.owner.bio = '';
        p.owner.profilePicture = '';
        p.title = p.category;
        p.description = '';
        p.currentProblem = '';
      }
      return p;
    });

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
