const { Review, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    productId: req.params.productId,
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name');

  res.json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// @desc    Create product review
// @route   POST /api/products/:productId/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, title, reviewText, purchasedSize, fitFeedback } = req.body;

  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    productId: req.params.productId,
    userId: req.user.userId,
  });

  if (existingReview) {
    return res.status(400).json({
      error: 'You have already reviewed this product',
    });
  }

  // Create review
  const review = await Review.create({
    productId: req.params.productId,
    userId: req.user.userId,
    rating,
    title,
    reviewText,
    purchasedSize,
    fitFeedback,
  });

  // Update product analytics
  const allReviews = await Review.find({ productId: req.params.productId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  product.analytics.averageRating = avgRating;
  product.analytics.reviewCount = allReviews.length;
  await product.save();

  await review.populate('userId', 'name');

  res.status(201).json({
    success: true,
    review,
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  // Update fields
  const { rating, title, reviewText, purchasedSize, fitFeedback } = req.body;
  
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (reviewText !== undefined) review.reviewText = reviewText;
  if (purchasedSize) review.purchasedSize = purchasedSize;
  if (fitFeedback) review.fitFeedback = fitFeedback;

  await review.save();

  // Recalculate product average rating
  const allReviews = await Review.find({ productId: review.productId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await Product.findByIdAndUpdate(review.productId, {
    'analytics.averageRating': avgRating,
  });

  res.json({
    success: true,
    review,
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const productId = review.productId;
  await review.deleteOne();

  // Recalculate product analytics
  const remainingReviews = await Review.find({ productId });
  const avgRating = remainingReviews.length > 0
    ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
    : 0;

  await Product.findByIdAndUpdate(productId, {
    'analytics.averageRating': avgRating,
    'analytics.reviewCount': remainingReviews.length,
  });

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};