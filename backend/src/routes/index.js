const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const chatRoutes = require('./chatRoutes');
const reviewRoutes = require('./reviewRoutes');
const searchRouter = require('./search');
const aiChatRouter = require('./chat')
// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);
router.use('/reviews', reviewRoutes);
router.use('/vector', searchRouter);
router.use('/ai', aiChatRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;