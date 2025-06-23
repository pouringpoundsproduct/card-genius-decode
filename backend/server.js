
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { API_ENDPOINTS, SERVER_CONFIG } = require('./config/apiConfig');
const bankService = require('./services/bankService');
const openaiService = require('./services/openaiService');
const cardSearchService = require('./services/cardSearchService');
const recommendationService = require('./services/recommendationService');
const { analyzeQuery } = require('./utils/queryAnalyzer');

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
    cache_status: bankService.getBankCache() ? 'loaded' : 'empty'
  });
});

// Main Chat Interface with Enhanced Intelligence
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    console.log('Received chat request:', message);
    
    const analysis = analyzeQuery(message);
    
    // Handle content creation queries
    if (analysis.isContentQuery) {
      const contentResponse = await openaiService.handleContentCreation(message, context);
      return res.json({
        response: contentResponse,
        source: "Content Creation Assistant",
        timestamp: new Date().toISOString()
      });
    }
    
    // Try BankKaro APIs first for card-related queries
    let bankKaroResponse = await cardSearchService.searchBankKaroKnowledge(message);
    
    if (bankKaroResponse) {
      return res.json({
        response: bankKaroResponse,
        source: "Research by BankKaro",
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback to ChatGPT with enhanced context
    const enhancedContext = await cardSearchService.buildEnhancedContext(message, analysis);
    const chatGPTResponse = await openaiService.getChatGPTResponse(message, enhancedContext);
    
    res.json({
      response: chatGPTResponse,
      source: "Research by ChatGPT",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhanced Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
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

// Initialize bank mappings on server start
bankService.initializeBankMappings();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Credit+ MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
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
});
