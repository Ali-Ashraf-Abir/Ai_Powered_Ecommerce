// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
    index: true,
  },
  
  // HUMAN-READABLE DESCRIPTION (What admin writes naturally)
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  
  // AI-ENHANCED DESCRIPTION (Processed for RAG)
  aiDescription: String,
  
  // STRUCTURED PRODUCT ATTRIBUTES
  color: [String],
  sizes: [String],
  material: String,
  brand: String,
  style: String,
  fit: String,
  
  // CONTEXTUAL INFORMATION (RAG Gold Mine)
  occasion: String,
  careInstructions: String,
  styleTips: String,
  targetAudience: String,
  season: [String],
  
  // METADATA
  metadata: mongoose.Schema.Types.Mixed,
  tags: [String],
  
  // MEDIA
  imageUrl: String,
  additionalImages: [String],
  videoUrl: String,
  
  // INVENTORY
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // STATUS
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // ANALYTICS (embedded for quick access)
  analytics: {
    viewCount: { type: Number, default: 0 },
    cartAddCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  
  // EMBEDDINGS (For vector search - Future RAG integration)
  embeddings: [{
    type: String,
    vector: [Number],
    createdAt: Date,
  }],
}, {
  timestamps: true,
});

// Text indexes for full-text search
productSchema.index({
  name: 'text',
  description: 'text',
  aiDescription: 'text',
  material: 'text',
  style: 'text',
  occasion: 'text',
  styleTips: 'text',
  tags: 'text',
});

// Compound indexes for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1, isFeatured: -1 });
productSchema.index({ category: 1, isActive: 1 });

// Instance methods
productSchema.methods.incrementView = function() {
  this.analytics.viewCount += 1;
  return this.save();
};

productSchema.methods.incrementCartAdd = function() {
  this.analytics.cartAddCount += 1;
  return this.save();
};

productSchema.methods.incrementPurchase = function() {
  this.analytics.purchaseCount += 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);