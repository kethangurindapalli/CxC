import mongoose from 'mongoose';

const collaborationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['join_request', 'collaboration_request'],
    required: true
  },
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

collaborationSchema.index({ project: 1, user: 1, type: 1 }, { unique: true });
collaborationSchema.index({ project: 1, status: 1 });
collaborationSchema.index({ user: 1, status: 1 });

export default mongoose.model('Collaboration', collaborationSchema);