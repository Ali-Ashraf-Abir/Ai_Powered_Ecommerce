const mongoose = require('mongoose');
const { Order, CartItem, Product, User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get cart items
    const cartItems = await CartItem.find({ userId: req.user.userId })
      .populate('productId')
      .session(session);

    if (cartItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Prepare order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cartItems) {
      const product = item.productId;

      // Check stock
      if (product.stockQuantity < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}`,
        });
      }

      orderItems.push({
        productId: product._id,
        productSnapshot: product.toObject(),
        quantity: item.quantity,
        price: product.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      });

      totalAmount += product.price * item.quantity;

      // Update product stock and analytics
      product.stockQuantity -= item.quantity;
      await product.incrementPurchase();
      await product.save({ session });
    }

    // Create order
    const order = await Order.create([{
      userId: req.user.userId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
    }], { session });

    // Clear cart
    await CartItem.deleteMany({ userId: req.user.userId }, { session });

    // Update user total orders
    await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { totalOrders: 1 } },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      order: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .populate('items.productId');

  res.json({
    success: true,
    count: orders.length,
    orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  }).populate('items.productId');

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({
    success: true,
    order,
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = status;

  // Update timestamps based on status
  if (status === 'shipped' && !order.shippedAt) {
    order.shippedAt = new Date();
  }
  if (status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    order,
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      error: 'Only pending orders can be cancelled',
    });
  }

  order.status = 'cancelled';
  await order.save();

  res.json({
    success: true,
    order,
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};