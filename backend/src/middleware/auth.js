// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.user = decoded;
        }
      });
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};