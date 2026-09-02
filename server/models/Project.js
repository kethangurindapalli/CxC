import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  technologies: [{
    type: String,
    trim: true
  }],
  currentProblem: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  visibility: {
    type: String,
    enum: ['Public', 'Connections Only', 'Private'],
    default: 'Public'
  }
}, {
  timestamps: true
});

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ category: 1 });
projectSchema.index({ technologies: 1 });
projectSchema.index({ visibility: 1 });

export default mongoose.model('Project', projectSchema);
