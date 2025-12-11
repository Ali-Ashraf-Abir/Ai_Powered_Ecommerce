const express = require('express');
const router = express.Router();
const {
  chat,
  getChatHistory,
  rateChatResponse,
} = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// All chat routes require authentication
router.use(authenticateToken);

router.post('/', chat);
router.get('/history', getChatHistory);
router.put('/:id/rate', rateChatResponse);

module.exports = router;
