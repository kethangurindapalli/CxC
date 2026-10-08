import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'connection_rejected',
      'message',
      'project_collaboration_request',
      'project_join_request',
      'project_collaboration_accepted',
      'project_join_accepted'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection'
  },
  relatedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);