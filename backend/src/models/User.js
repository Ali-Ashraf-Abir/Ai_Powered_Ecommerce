// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // Keep this, remove index below
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  
  // RAG-FRIENDLY: User preferences in natural language
  stylePreferences: {
    type: String,
    default: '',
  },
  sizePreferences: {
    tops: String,
    pants: String,
    shoes: String,
  },
  
  // User behavior tracking
  lastLogin: Date,
  totalOrders: {
    type: Number,
    default: 0,
  },
  favoriteCategories: [String],
  browsingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes - Remove duplicate email index
userSchema.index({ name: 'text', email: 'text' });

// Instance methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);