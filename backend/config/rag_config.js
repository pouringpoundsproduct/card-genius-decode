require('dotenv').config();

const RAG_CONFIG = {
  // Vector Database Settings
  VECTOR_DB_DIMENSION: parseInt(process.env.VECTOR_DB_DIMENSION) || 1536,
  MAX_RETRIEVAL_RESULTS: parseInt(process.env.MAX_RETRIEVAL_RESULTS) || 5,
  
  // Scoring and Thresholds
  CONFIDENCE_THRESHOLD: parseFloat(process.env.RAG_CONFIDENCE_THRESHOLD) || 0.3,
  API_SCORE_WEIGHT: 0.4,
  MITC_SCORE_WEIGHT: 0.35,
  OPENAI_SCORE_WEIGHT: 0.25,
  
  // Fallback Settings
  ENABLE_FALLBACK: process.env.ENABLE_FALLBACK !== 'false',
  MAX_FALLBACK_ATTEMPTS: 3,
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  
  // API Configuration
  BANKKARO_API_BASE: process.env.BANKKARO_API_BASE || 'https://bk-api.bankkaro.com/sp/api',
  
  // File Paths
  MITC_DOCUMENTS_PATH: process.env.MITC_DOCUMENTS_PATH || './card-mitc-documents',
  
  // Caching
  CACHE_DURATION: parseInt(process.env.CACHE_DURATION) || 10 * 60 * 1000, // 10 minutes
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
  
  // Learning and Feedback
  ENABLE_LEARNING: process.env.ENABLE_LEARNING !== 'false',
  FEEDBACK_THRESHOLD: parseFloat(process.env.FEEDBACK_THRESHOLD) || 0.5,
  LEARNING_RATE: parseFloat(process.env.LEARNING_RATE) || 0.1,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_DEBUG: process.env.ENABLE_DEBUG === 'true',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

// Validation
if (!RAG_CONFIG.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
}

if (!RAG_CONFIG.BANKKARO_API_BASE) {
  console.warn('⚠️  BANKKARO_API_BASE not found in environment variables');
}

module.exports = {
  RAG_CONFIG
}; 