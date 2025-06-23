
require('dotenv').config();

const API_ENDPOINTS = {
  BANK_TAGS: `${process.env.BANKKARO_API_BASE}/bank-tags`,
  CARDS: `${process.env.BANKKARO_API_BASE}/cards`,
  CARD_RECOMMENDATION: process.env.CARD_RECOMMENDATION_API
};

const SERVER_CONFIG = {
  PORT: process.env.PORT || 4000,
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = {
  API_ENDPOINTS,
  SERVER_CONFIG
};
