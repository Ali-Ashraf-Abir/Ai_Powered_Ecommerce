const { CartItem, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cartItems = await CartItem.find({ userId: req.user.userId })
    .populate('productId');

  res.json({
    success: true,
    count: cartItems.length,
    cartItems,
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, selectedSize, selectedColor } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Check if item already exists in cart
  const existingItem = await CartItem.findOne({
    userId: req.user.userId,
    productId,
    selectedSize,
    selectedColor,
  });

  let cartItem;

  if (existingItem) {
    // Update quantity
    existingItem.quantity += quantity;
    cartItem = await existingItem.save();
  } else {
    // Create new cart item
    cartItem = await CartItem.create({
      userId: req.user.userId,
      productId,
      quantity,
      selectedSize,
      selectedColor,
    });
  }

  // Update product analytics
  await product.incrementCartAdd();

  // Populate product details
  await cartItem.populate('productId');

  res.status(201).json({
    success: true,
    cartItem,
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ 
      error: 'Quantity must be at least 1' 
    });
  }

  const cartItem = await CartItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { quantity },
    { new: true, runValidators: true }
  ).populate('productId');

  if (!cartItem) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  res.json({
    success: true,
    cartItem,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cartItem = await CartItem.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!cartItem) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  res.json({
    success: true,
    message: 'Item removed from cart',
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  await CartItem.deleteMany({ userId: req.user.userId });

  res.json({
    success: true,
    message: 'Cart cleared',
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};