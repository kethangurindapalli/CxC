import Project from '../models/Project.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { findMatches } from '../services/matching.js';

export const getMatches = async (req, res) => {
  try {
    const userProjects = await Project.find({ owner: req.user._id, status: 'Active' });
    if (userProjects.length === 0) return res.json({ success: true, matches: [] });

    const allUsers = await User.find({ _id: { $ne: req.user._id } });
    const allProjects = await Project.find({ owner: { $ne: req.user._id }, status: 'Active' });

    // Build connections map for visibility filtering
    const connections = await Connection.find({
      $or: [{ sender: req.user._id, status: 'accepted' }, { receiver: req.user._id, status: 'accepted' }]
    });
    const connMap = new Map();
    connections.forEach(c => {
      connMap.set(`${c.sender}-${c.receiver}`, true);
      connMap.set(`${c.receiver}-${c.sender}`, true);
    });

    let allMatches = [];
    for (const project of userProjects) {
      const matches = await findMatches(req.user, project, allUsers, allProjects, connMap);
      // Tag with source project
      matches.forEach(m => m.sourceProject = { _id: project._id, title: project.title });
      allMatches = [...allMatches, ...matches];
    }

    // Deduplicate by user keeping highest percentage
    const map = new Map();
    for (const match of allMatches) {
      const key = match.user._id.toString();
      if (!map.has(key) || match.matchPercentage > map.get(key).matchPercentage) {
        map.set(key, match);
      }
    }
    const uniqueMatches = Array.from(map.values()).sort((a, b) => b.matchPercentage - a.matchPercentage);
    res.json({ success: true, matches: uniqueMatches.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMatchesForProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const allUsers = await User.find({ _id: { $ne: req.user._id } });
    const allProjects = await Project.find({ owner: { $ne: req.user._id }, status: 'Active' });
    const connections = await Connection.find({
      $or: [{ sender: req.user._id, status: 'accepted' }, { receiver: req.user._id, status: 'accepted' }]
    });
    const connMap = new Map();
    connections.forEach(c => {
      connMap.set(`${c.sender}-${c.receiver}`, true);
      connMap.set(`${c.receiver}-${c.sender}`, true);
    });

    const matches = await findMatches(req.user, project, allUsers, allProjects, connMap);
    res.json({ success: true, matches: matches.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
