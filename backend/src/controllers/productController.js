// src/controllers/productController.js
const { Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all products with filtering
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const query = { isActive: true };

  // Category filter
  if (category && category !== 'all') {
    query.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = search
    ? { score: { $meta: 'textScore' } }
    : { [sortBy]: sortOrder };

  // Execute query
  const products = await Product.find(query)
    .sort(sort)
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .select('-embeddings'); // Exclude embeddings from response

  // Get total count for pagination
  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    count: products.length,
    total,
    page: parseInt(offset) / parseInt(limit) || 0,
    totalPages: Math.ceil(total / parseInt(limit)),
    products,
  });

});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: 'Product not found'
    });
  }

  // Increment view count
  await product.incrementView();

  res.json({
    success: true,
    product,
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!product) {
    return res.status(404).json({
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    product,
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: 'Product not found'
    });
  }

  // Soft delete - just mark as inactive
  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isFeatured: true
  })
    .limit(10)
    .select('-embeddings');

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });

  res.json({
    success: true,
    categories,
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getCategories,
};