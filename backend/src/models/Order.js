const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productSnapshot: mongoose.Schema.Types.Mixed,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    selectedSize: String,
    selectedColor: String,
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // Shipping information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  
  // Payment information
  paymentMethod: String,
  paymentStatus: {
    type: String,
    default: 'pending',
  },
  
  // Tracking
  trackingNumber: String,
  
  // Timestamps
  shippedAt: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);