const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get reviews (public)
router.get('/products/:productId/reviews', getProductReviews);

// Create review (authenticated)
router.post('/products/:productId/reviews', authenticateToken, createReview);

// Update/delete review (authenticated)
router.put('/:id', authenticateToken, updateReview);
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;