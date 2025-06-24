
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
    cache_status: bankService.getBankCache() ? 'loaded' : 'empty',
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

// Main Chat Interface - Modified to prioritize ChatGPT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    console.log('Received chat request:', message);
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // For your requirement: All responses should come from OpenAI
    // We'll still use BankKaro data to enhance the context, but responses come from ChatGPT
    
    const analysis = analyzeQuery(message);
    console.log('Query analysis:', analysis);
    
    // Build enhanced context with BankKaro data
    let enhancedContext = context || "You are a helpful credit card expert assistant focusing on the Indian market.";
    
    // Try to get relevant card data to enhance context
    if (analysis.isCardQuery) {
      try {
        await bankService.ensureBankMappingsLoaded();
        const bankCache = bankService.getBankCache();
        
        if (bankCache && bankCache.banks) {
          const bankNames = bankCache.banks.slice(0, 10).map(bank => bank.name).join(", ");
          enhancedContext += ` Available major banks in India include: ${bankNames}.`;
        }
        
        // Try to get some card data for context
        const cardData = await cardSearchService.searchBankKaroKnowledge(message);
        if (cardData) {
          enhancedContext += " Based on current market data, " + cardData.substring(0, 500);
        }
      } catch (error) {
        console.log('Could not enhance context with BankKaro data:', error.message);
      }
    }
    
    // Always get response from ChatGPT (as per your requirement)
    const chatGPTResponse = await openaiService.getChatGPTResponse(message, enhancedContext);
    
    res.json({
      response: chatGPTResponse,
      source: "ChatGPT with BankKaro Intelligence",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Test OpenAI Connection
app.get('/api/test-openai', async (req, res) => {
  try {
    const testResponse = await openaiService.getChatGPTResponse("Hello, this is a test message.", "You are a helpful assistant.");
    res.json({
      status: 'success',
      response: testResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Initialize bank mappings on server start
bankService.initializeBankMappings();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Credit+ MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 OpenAI test: http://localhost:${PORT}/api/test-openai`);
  console.log('🏦 API Endpoints configured:');
  console.log('  - Bank Tags:', API_ENDPOINTS.BANK_TAGS);
  console.log('  - Cards:', API_ENDPOINTS.CARDS);
  console.log('  - Recommendations:', API_ENDPOINTS.CARD_RECOMMENDATION);
  console.log('💡 Features enabled:');
  console.log('  ✅ ChatGPT Integration (Primary Response Source)');
  console.log('  ✅ BankKaro Data Enhancement');
  console.log('  ✅ Intelligent Query Routing');
  console.log('  ✅ Spending Analysis');
  console.log('  ✅ Content Creation');
  console.log('  ✅ Enhanced Recommendations');
});
