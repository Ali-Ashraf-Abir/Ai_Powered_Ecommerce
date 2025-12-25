const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategories,
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected routes (admin)
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;
