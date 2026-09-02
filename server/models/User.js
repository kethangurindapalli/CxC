import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    enum: ['Available', 'Sometimes available', 'Not available'],
    default: 'Available'
  },
  anonymousMode: {
    type: Boolean,
    default: false
  },
  activityVisibility: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Helper to get public-safe user object respecting anonymousMode
userSchema.methods.toPublic = function(requesterId = null, isConnected = false) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.email; // never expose email publicly
  if (obj.anonymousMode) {
    // Anonymous: hide identity
    const anonId = obj._id.toString().slice(-4);
    obj.name = `Anonymous User #${anonId}`;
    obj.profilePicture = '';
    obj.bio = '';
    // keep skills, interests, availability (if visibility allowed), category derived from projects elsewhere
  }
  // Hide activity if user disabled it and requester is not self
  if (!obj.activityVisibility && requesterId?.toString() !== obj._id.toString()) {
    delete obj.lastActive;
  }
  return obj;
};

export default mongoose.model('User', userSchema);
