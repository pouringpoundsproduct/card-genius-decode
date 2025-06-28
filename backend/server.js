const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { API_ENDPOINTS, SERVER_CONFIG } = require('./config/apiConfig');
const { RAG_CONFIG } = require('./config/rag_config');
const bankService = require('./services/bankService');
const openaiService = require('./services/openaiService');
const cardSearchService = require('./services/cardSearchService');
const recommendationService = require('./services/recommendationService');
const { analyzeQuery } = require('./utils/queryAnalyzer');

// Import RAG services
const retrievalService = require('./services/rag/retrieval');
const scoringSystem = require('./services/rag/scoring');
const vectorStore = require('./services/rag/vector_store');
const pdfProcessor = require('./services/rag/pdf_processor');

const app = express();
const PORT = SERVER_CONFIG.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(API_ENDPOINTS),
    cache_status: bankService.getBankCache() ? 'loaded' : 'empty',
    rag_status: retrievalService.isInitialized ? 'initialized' : 'not_initialized'
  });
});

// RAG System Status
app.get('/api/rag/status', (req, res) => {
  try {
    const stats = retrievalService.getSystemStats();
    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RAG Status API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get RAG status',
      message: error.message 
    });
  }
});

// Enhanced Chat Interface with RAG
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, userId = 'default' } = req.body;
    console.log('Received chat request:', message);
    
    // Use RAG system for processing
    const ragResponse = await retrievalService.processQuery(message, userId, context);
    
    res.json({
      response: ragResponse.answer,
      source: ragResponse.source,
      confidence: ragResponse.confidence,
      cards_recommended: ragResponse.cards_recommended,
      followup_questions: ragResponse.followup_questions,
      timestamp: ragResponse.timestamp
    });
    
  } catch (error) {
    console.error('Enhanced Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error.message 
    });
  }
});

// RAG-specific chat endpoint
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { query, userId = 'default', context = {} } = req.body;
    console.log('RAG Chat request:', query);
    
    const response = await retrievalService.processQuery(query, userId, context);
    
    res.json({
      status: 'success',
      data: response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RAG Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process RAG query',
      message: error.message 
    });
  }
});

// Feedback endpoint for RAG system
app.post('/api/rag/feedback', (req, res) => {
  try {
    const { query, response, source, rating, feedback = '' } = req.body;
    
    retrievalService.recordFeedback(query, response, source, rating, feedback);
    
    res.json({
      status: 'success',
      message: 'Feedback recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RAG Feedback API Error:', error);
    res.status(500).json({ 
      error: 'Failed to record feedback',
      message: error.message 
    });
  }
});

// Vector database search endpoint
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS } = req.body;
    
    const results = await retrievalService.searchVectorDatabases(query, limit);
    
    res.json({
      status: 'success',
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Vector Search API Error:', error);
    res.status(500).json({ 
      error: 'Failed to search vector databases',
      message: error.message 
    });
  }
});

// Admin endpoints for RAG system management
app.post('/api/admin/rag/refresh', async (req, res) => {
  try {
    await retrievalService.refreshVectorDatabases();
    
    res.json({
      status: 'success',
      message: 'Vector databases refreshed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RAG Refresh API Error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh vector databases',
      message: error.message 
    });
  }
});

app.post('/api/admin/rag/reset', (req, res) => {
  try {
    scoringSystem.reset();
    retrievalService.clearAllConversationHistory();
    
    res.json({
      status: 'success',
      message: 'RAG system reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RAG Reset API Error:', error);
    res.status(500).json({ 
      error: 'Failed to reset RAG system',
      message: error.message 
    });
  }
});

app.post('/api/admin/rag/threshold', (req, res) => {
  try {
    const { threshold } = req.body;
    
    if (threshold === undefined || threshold < 0 || threshold > 1) {
      return res.status(400).json({
        error: 'Invalid threshold value. Must be between 0 and 1.'
      });
    }
    
    scoringSystem.setConfidenceThreshold(threshold);
    
    res.json({
      status: 'success',
      message: `Confidence threshold updated to ${threshold}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RAG Threshold API Error:', error);
    res.status(500).json({ 
      error: 'Failed to update confidence threshold',
      message: error.message 
    });
  }
});

// MITC documents management
app.get('/api/admin/mitc/stats', async (req, res) => {
  try {
    const stats = await pdfProcessor.getDocumentStats();
    
    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MITC Stats API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get MITC document statistics',
      message: error.message 
    });
  }
});

app.post('/api/admin/mitc/sample', async (req, res) => {
  try {
    await pdfProcessor.createSampleStructure();
    
    res.json({
      status: 'success',
      message: 'Sample MITC document structure created',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MITC Sample API Error:', error);
    res.status(500).json({ 
      error: 'Failed to create sample MITC structure',
      message: error.message 
    });
  }
});

// Enhanced Card Recommendation with Spending Analysis
app.post('/api/recommend-cards', async (req, res) => {
  try {
    const spendingData = req.body;
    const result = await recommendationService.getCardRecommendations(spendingData);
    res.json(result);
  } catch (error) {
    console.error('Enhanced Recommendation API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get card recommendations',
      message: error.message 
    });
  }
});

// Initialize services on server start
async function initializeServices() {
  try {
    console.log('🚀 Initializing services...');
    
    // Initialize bank mappings (with error handling)
    try {
      await bankService.initializeBankMappings();
    } catch (error) {
      console.warn('⚠️ Bank mappings initialization failed, continuing with RAG system...');
    }
    
    // Initialize RAG system
    await retrievalService.initialize();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    console.log('🔄 Some services may not be fully functional');
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Credit+ MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 RAG status: http://localhost:${PORT}/api/rag/status`);
  console.log('🏦 API Endpoints configured:');
  console.log('  - Bank Tags:', API_ENDPOINTS.BANK_TAGS);
  console.log('  - Cards:', API_ENDPOINTS.CARDS);
  console.log('  - Recommendations:', API_ENDPOINTS.CARD_RECOMMENDATION);
  console.log('💡 Features enabled:');
  console.log('  ✅ Bank-Card Mapping');
  console.log('  ✅ Intelligent Query Routing');
  console.log('  ✅ Spending Analysis');
  console.log('  ✅ Content Creation');
  console.log('  ✅ Enhanced Recommendations');
  console.log('  ✅ RAG-based AI Chatbot');
  console.log('  ✅ Three-tier Response System');
  console.log('  ✅ Vector Database');
  console.log('  ✅ Adaptive Scoring');
  console.log('  ✅ MITC Document Processing');
  
  // Initialize services
  initializeServices();
});
