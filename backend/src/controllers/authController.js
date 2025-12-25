// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({ 
      error: 'Please provide email, password, and name' 
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ 
      error: 'User already exists with this email' 
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    email,
    passwordHash,
    name,
  });

  // Generate token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Please provide email and password' 
    });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-passwordHash');
  
  if (!user) {
    return res.status(404).json({ 
      error: 'User not found' 
    });
  }

  res.json({
    success: true,
    user,
  });
});

module.exports = {
  register,
  login,
  getMe,
};