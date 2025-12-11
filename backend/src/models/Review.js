const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
  },
  reviewText: {
    type: String,
    trim: true,
  },
  
  // Helpful for AI to understand fit and sizing
  purchasedSize: String,
  fitFeedback: {
    type: String,
    enum: ['true_to_size', 'runs_small', 'runs_large'],
  },
  
  // Moderation
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ title: 'text', reviewText: 'text' });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);