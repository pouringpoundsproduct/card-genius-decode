const vectorStore = require('./vector_store');
const fallbackManager = require('./fallback_manager');
const scoringSystem = require('./scoring');
const pdfProcessor = require('./pdf_processor');
const { RAG_CONFIG } = require('../../config/rag_config');
const axios = require('axios');

class RetrievalService {
  constructor() {
    this.isInitialized = false;
    this.conversationHistory = new Map();
  }

  /**
   * Initialize the RAG system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing RAG System...');
      
      // Initialize vector store
      await vectorStore.initialize();
      
      // Process MITC documents
      await this.loadMITCDocuments();
      
      // Load initial API data
      await this.loadAPIData();
      
      this.isInitialized = true;
      console.log('✅ RAG System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RAG System:', error);
      throw error;
    }
  }

  /**
   * Process a user query through the RAG system
   */
  async processQuery(query, userId = 'default', context = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Processing query: "${query}" for user: ${userId}`);
      
      // Get conversation history
      const history = this.getConversationHistory(userId);
      
      // Add context from conversation history
      const enhancedContext = {
        ...context,
        conversationHistory: history.slice(-5), // Last 5 messages
        userId
      };

      // Execute three-tier fallback system
      const response = await fallbackManager.executeWithFallback(query, enhancedContext);
      
      // Store in conversation history
      this.addToConversationHistory(userId, {
        query,
        response: response.answer,
        source: response.source,
        confidence: response.confidence,
        timestamp: Date.now()
      });

      // Log response details
      console.log(`📊 Response generated - Source: ${response.source}, Confidence: ${response.confidence.toFixed(2)}`);
      
      return response;
    } catch (error) {
      console.error('❌ Error processing query:', error);
      return {
        answer: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        source: 'error',
        confidence: 0.0,
        cards_recommended: [],
        followup_questions: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Load API data into vector store
   */
  async loadAPIData() {
    try {
      console.log('📊 Loading API data into vector store...');
      
      // Fetch real cards from BankKaro API
      const apiPayload = {
        slug: "",
        banks_ids: [],
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "",
        free_cards: "",
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      const response = await axios.post(`${RAG_CONFIG.BANKKARO_API_BASE}/cards`, apiPayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.data && response.data.data.cards) {
        const cards = response.data.data.cards;
        console.log(`📊 Fetched ${cards.length} cards from API`);
        
        await vectorStore.addAPIData(cards);
        console.log(`✅ Loaded ${cards.length} cards into vector store`);
      } else {
        console.warn('⚠️ No cards data received from API, using fallback sample data');
        await this.loadSampleData();
      }
    } catch (error) {
      console.error('❌ Error loading API data:', error.message);
      console.log('🔄 Falling back to sample data...');
      await this.loadSampleData();
    }
  }

  /**
   * Load sample data as fallback
   */
  async loadSampleData() {
    try {
      const sampleCards = [
        {
          id: 1,
          name: 'HDFC Regalia',
          bank_name: 'HDFC Bank',
          card_type: 'Premium',
          annual_fee: '₹2,500',
          rewards: '4X rewards on dining, 2X on travel',
          benefits: 'Lounge access, travel insurance',
          eligibility: 'Income > ₹12 LPA'
        },
        {
          id: 2,
          name: 'ICICI Amazon Pay',
          bank_name: 'ICICI Bank',
          card_type: 'Co-branded',
          annual_fee: '₹500',
          rewards: '5% cashback on Amazon, 2% on other spends',
          benefits: 'No fuel surcharge, Amazon Prime membership',
          eligibility: 'Good credit score'
        }
      ];

      await vectorStore.addAPIData(sampleCards);
      console.log('✅ Loaded sample data into vector store');
    } catch (error) {
      console.error('❌ Error loading sample data:', error);
    }
  }

  /**
   * Load MITC documents into vector store
   */
  async loadMITCDocuments() {
    try {
      console.log('📄 Loading MITC documents into vector store...');
      
      // Process all MITC documents
      const processedDocs = await pdfProcessor.processAllMITCDocuments();
      
      // Add to vector store
      for (const doc of processedDocs) {
        await vectorStore.addMITCDocument(doc.cardName, doc.text, doc.filePath);
      }
      
      console.log(`✅ Loaded ${processedDocs.length} MITC documents into vector store`);
    } catch (error) {
      console.error('❌ Error loading MITC documents:', error);
    }
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Add message to conversation history
   */
  addToConversationHistory(userId, message) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    history.push(message);
    
    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  /**
   * Record user feedback
   */
  recordFeedback(query, response, source, userRating, feedback = '') {
    try {
      scoringSystem.recordFeedback(query, response, source, userRating, feedback);
      console.log(`📊 Feedback recorded: ${userRating}/5 for ${source} response`);
    } catch (error) {
      console.error('❌ Error recording feedback:', error);
    }
  }

  /**
   * Search in vector databases
   */
  async searchVectorDatabases(query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS) {
    try {
      const apiResults = await vectorStore.searchAPI(query, limit);
      const mitcResults = await vectorStore.searchMITC(query, limit);
      
      return {
        api: apiResults,
        mitc: mitcResults,
        totalResults: apiResults.length + mitcResults.length
      };
    } catch (error) {
      console.error('❌ Error searching vector databases:', error);
      return { api: [], mitc: [], totalResults: 0 };
    }
  }

  /**
   * Refresh vector databases with new data
   */
  async refreshVectorDatabases() {
    try {
      console.log('🔄 Refreshing vector databases...');
      
      // Clear existing data
      vectorStore.clear();
      
      // Reload data
      await this.loadAPIData();
      await this.loadMITCDocuments();
      
      console.log('✅ Vector databases refreshed');
    } catch (error) {
      console.error('❌ Error refreshing vector databases:', error);
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    const vectorStats = vectorStore.getStats();
    const scoringStats = scoringSystem.getStats();
    const fallbackStats = fallbackManager.getStats();
    
    return {
      system: {
        isInitialized: this.isInitialized,
        activeUsers: this.conversationHistory.size,
        totalConversations: Array.from(this.conversationHistory.values())
          .reduce((sum, history) => sum + history.length, 0)
      },
      vectorStore: vectorStats,
      scoring: scoringStats,
      fallback: fallbackStats,
      lastUpdated: Date.now()
    };
  }

  /**
   * Clear conversation history for a user
   */
  clearConversationHistory(userId) {
    this.conversationHistory.delete(userId);
    console.log(`🗑️  Conversation history cleared for user: ${userId}`);
  }

  /**
   * Clear all conversation history
   */
  clearAllConversationHistory() {
    this.conversationHistory.clear();
    console.log('🗑️  All conversation history cleared');
  }

  /**
   * Get conversation context for a user
   */
  getConversationContext(userId) {
    const history = this.getConversationHistory(userId);
    if (history.length === 0) {
      return null;
    }

    // Build context from recent messages
    const recentMessages = history.slice(-3);
    const context = {
      recentQueries: recentMessages.map(msg => msg.query),
      userPreferences: this.extractUserPreferences(history),
      lastInteraction: history[history.length - 1].timestamp
    };

    return context;
  }

  /**
   * Extract user preferences from conversation history
   */
  extractUserPreferences(history) {
    const preferences = {
      cardTypes: new Set(),
      banks: new Set(),
      features: new Set()
    };

    for (const message of history) {
      const query = message.query.toLowerCase();
      
      // Extract card types
      if (query.includes('travel')) preferences.cardTypes.add('travel');
      if (query.includes('cashback')) preferences.cardTypes.add('cashback');
      if (query.includes('rewards')) preferences.cardTypes.add('rewards');
      if (query.includes('premium')) preferences.cardTypes.add('premium');
      
      // Extract banks
      const banks = ['hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank'];
      for (const bank of banks) {
        if (query.includes(bank)) preferences.banks.add(bank);
      }
      
      // Extract features
      if (query.includes('lounge')) preferences.features.add('lounge access');
      if (query.includes('insurance')) preferences.features.add('insurance');
      if (query.includes('annual fee')) preferences.features.add('low annual fee');
    }

    return {
      cardTypes: Array.from(preferences.cardTypes),
      banks: Array.from(preferences.banks),
      features: Array.from(preferences.features)
    };
  }
}

module.exports = new RetrievalService(); 