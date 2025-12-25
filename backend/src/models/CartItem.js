const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  selectedSize: String,
  selectedColor: String,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

cartItemSchema.index({ userId: 1, productId: 1, selectedSize: 1, selectedColor: 1 });

module.exports = mongoose.model('CartItem', cartItemSchema);