// src/controllers/chatController.js
const { ChatLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const crypto = require('crypto');

// @desc    Handle chat message
// @route   POST /api/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Get or create session ID
  const sessionId = req.headers['x-session-id'] || crypto.randomUUID();

  // TODO: This is where RAG integration will happen
  // For now, return a placeholder response

  const response = "I'm your AI shopping assistant! RAG functionality will be integrated here to provide personalized recommendations based on our product catalog.";

  // Log conversation
  const chatLog = await ChatLog.create({
    userId: req.user.userId,
    sessionId,
    message,
    response,
    context: {
      conversationHistory,
      timestamp: new Date(),
    },
  });

  res.json({
    success: true,
    response,
    sessionId,
    suggestions: [
      'Show me summer dresses',
      'What jackets do you have?',
      'Help me find a gift',
      'I need something for a wedding',
    ],
  });
});

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId, limit = 50 } = req.query;

  const query = { userId: req.user.userId };
  if (sessionId) {
    query.sessionId = sessionId;
  }

  const chatLogs = await ChatLog.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: chatLogs.length,
    chatLogs: chatLogs.reverse(), // Oldest first
  });
});

// @desc    Rate chat response
// @route   PUT /api/chat/:id/rate
// @access  Private
const rateChatResponse = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'Rating must be between 1 and 5',
    });
  }

  const chatLog = await ChatLog.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { userSatisfaction: rating },
    { new: true }
  );

  if (!chatLog) {
    return res.status(404).json({ error: 'Chat log not found' });
  }

  res.json({
    success: true,
    message: 'Thank you for your feedback!',
    chatLog,
  });
});

module.exports = {
  chat,
  getChatHistory,
  rateChatResponse,
};