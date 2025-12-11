const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Conversation data
  message: {
    type: String,
    required: true,
  },
  response: String,
  intent: String,
  
  // Context
  context: mongoose.Schema.Types.Mixed,
  
  // RAG-specific fields
  retrievedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  recommendedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  actionTaken: String,
  
  // Feedback
  userSatisfaction: {
    type: Number,
    min: 1,
    max: 5,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

chatLogSchema.index({ message: 'text', response: 'text' });
chatLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatLog', chatLogSchema);