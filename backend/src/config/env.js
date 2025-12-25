// src/config/env.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_db',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};