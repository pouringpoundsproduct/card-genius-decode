const { RAG_CONFIG } = require('../../config/rag_config');
const scoringSystem = require('./scoring');
const openaiService = require('../openaiService');
const axios = require('axios');

class FallbackManager {
  constructor() {
    this.maxAttempts = RAG_CONFIG.MAX_FALLBACK_ATTEMPTS;
    this.confidenceThreshold = RAG_CONFIG.CONFIDENCE_THRESHOLD;
  }

  /**
   * Execute three-tier response system with fallback
   */
  async executeWithFallback(query, context = {}) {
    try {
      console.log('🔄 Executing three-tier response system...');
      
      // Tier 1: API Data
      const apiResponse = await this.tryAPITier(query, context);
      if (apiResponse && apiResponse.confidence >= this.confidenceThreshold) {
        console.log('✅ API tier response accepted');
        return this.formatResponse(apiResponse, 'api');
      }

      // Tier 2: MITC Documents
      const mitcResponse = await this.tryMITCTier(query, context);
      if (mitcResponse && mitcResponse.confidence >= this.confidenceThreshold) {
        console.log('✅ MITC tier response accepted');
        return this.formatResponse(mitcResponse, 'mitc');
      }

      // Tier 3: OpenAI API
      const openaiResponse = await this.tryOpenAITier(query, context);
      if (openaiResponse) {
        console.log('✅ OpenAI tier response accepted');
        return this.formatResponse(openaiResponse, 'openai');
      }

      // All tiers failed
      console.log('❌ All tiers failed, returning fallback response');
      return this.getFallbackResponse(query);
      
    } catch (error) {
      console.error('❌ Error in fallback manager:', error);
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Try API tier (Tier 1)
   */
  async tryAPITier(query, context) {
    try {
      console.log('🔍 Trying API tier...');
      
      // Call BankKaro API
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
        const relevantCards = this.findRelevantCards(query, cards);
        
        if (relevantCards.length > 0) {
          const responseText = this.formatCardResponse(relevantCards, query);
          const confidence = scoringSystem.calculateConfidenceScore(query, responseText, 'api');
          
          return {
            answer: responseText,
            confidence,
            cards: relevantCards,
            source: 'api'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ API tier failed:', error.message);
      return null;
    }
  }

  /**
   * Try MITC tier (Tier 2)
   */
  async tryMITCTier(query, context) {
    try {
      console.log('🔍 Trying MITC tier...');
      
      // This would integrate with the vector store to search MITC documents
      // For now, return a placeholder response
      const mitcResponse = `Based on the MITC documents, here are the key terms and conditions related to your query: "${query}". 
      
      Please note that specific terms may vary by card and are subject to change. For the most current information, 
      please refer to the official bank documents or contact the bank directly.`;
      
      const confidence = scoringSystem.calculateConfidenceScore(query, mitcResponse, 'mitc');
      
      return {
        answer: mitcResponse,
        confidence,
        source: 'mitc'
      };
    } catch (error) {
      console.error('❌ MITC tier failed:', error.message);
      return null;
    }
  }

  /**
   * Try OpenAI tier (Tier 3)
   */
  async tryOpenAITier(query, context) {
    try {
      console.log('🔍 Trying OpenAI tier...');
      
      const enhancedContext = this.buildEnhancedContext(query, context);
      const openaiResponse = await openaiService.getChatGPTResponse(query, enhancedContext);
      
      if (openaiResponse) {
        const confidence = scoringSystem.calculateConfidenceScore(query, openaiResponse, 'openai');
        
        return {
          answer: openaiResponse,
          confidence,
          source: 'openai'
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ OpenAI tier failed:', error.message);
      return null;
    }
  }

  /**
   * Find relevant cards based on query
   */
  findRelevantCards(query, cards) {
    const queryLower = query.toLowerCase();
    const relevantCards = [];
    
    for (const card of cards) {
      let relevanceScore = 0;
      
      // Check card name
      if (card.name && card.name.toLowerCase().includes(queryLower)) {
        relevanceScore += 3;
      }
      
      // Check bank name
      if (card.bank_name && card.bank_name.toLowerCase().includes(queryLower)) {
        relevanceScore += 2;
      }
      
      // Check card type
      if (card.card_type && card.card_type.toLowerCase().includes(queryLower)) {
        relevanceScore += 2;
      }
      
      // Check rewards/benefits
      if (card.rewards && card.rewards.toLowerCase().includes(queryLower)) {
        relevanceScore += 1;
      }
      
      if (card.benefits && card.benefits.toLowerCase().includes(queryLower)) {
        relevanceScore += 1;
      }
      
      // Check for specific keywords
      const keywords = ['travel', 'cashback', 'rewards', 'lounge', 'free', 'premium'];
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          if (card.rewards && card.rewards.toLowerCase().includes(keyword)) {
            relevanceScore += 1;
          }
          if (card.benefits && card.benefits.toLowerCase().includes(keyword)) {
            relevanceScore += 1;
          }
        }
      }
      
      if (relevanceScore > 0) {
        relevantCards.push({ ...card, relevanceScore });
      }
    }
    
    // Sort by relevance score and return top 5
    return relevantCards
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  /**
   * Format card response
   */
  formatCardResponse(cards, query) {
    if (cards.length === 0) {
      return "I couldn't find any credit cards matching your criteria. Please try rephrasing your query or check with the bank directly.";
    }
    
    let response = `Based on your query "${query}", here are some relevant credit cards:\n\n`;
    
    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      const card = cards[i];
      response += `${i + 1}. **${card.name}** (${card.bank_name})\n`;
      
      if (card.annual_fee) {
        response += `   Annual Fee: ${card.annual_fee}\n`;
      }
      
      if (card.rewards) {
        response += `   Rewards: ${card.rewards}\n`;
      }
      
      if (card.benefits) {
        response += `   Benefits: ${card.benefits}\n`;
      }
      
      response += '\n';
    }
    
    if (cards.length > 3) {
      response += `... and ${cards.length - 3} more cards available.\n\n`;
    }
    
    response += "For detailed information and to apply, please visit the respective bank's website or contact them directly.";
    
    return response;
  }

  /**
   * Build enhanced context for OpenAI
   */
  buildEnhancedContext(query, context) {
    let enhancedContext = "You are an expert credit card advisor for the Indian market. ";
    
    // Add query-specific context
    if (query.toLowerCase().includes('travel')) {
      enhancedContext += "Focus on travel benefits, lounge access, and travel rewards. ";
    }
    
    if (query.toLowerCase().includes('cashback')) {
      enhancedContext += "Focus on cashback percentages and spending categories. ";
    }
    
    if (query.toLowerCase().includes('premium')) {
      enhancedContext += "Focus on premium cards with high annual fees and exclusive benefits. ";
    }
    
    enhancedContext += "Provide practical, actionable advice and always mention that for the most current and detailed information, users should verify with the respective banks.";
    
    return enhancedContext;
  }

  /**
   * Format final response
   */
  formatResponse(response, source) {
    return {
      answer: response.answer,
      source: source,
      confidence: response.confidence,
      cards_recommended: response.cards || [],
      followup_questions: this.generateFollowupQuestions(response.answer, source),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate follow-up questions
   */
  generateFollowupQuestions(answer, source) {
    const questions = [
      "Would you like to compare these cards in detail?",
      "Do you need information about the application process?",
      "Would you like to know about the eligibility criteria?",
      "Are you interested in specific benefits like lounge access or travel insurance?"
    ];
    
    // Return 2-3 random questions
    return questions.sort(() => 0.5 - Math.random()).slice(0, 2);
  }

  /**
   * Get fallback response when all tiers fail
   */
  getFallbackResponse(query) {
    return {
      answer: `I apologize, but I'm having trouble finding specific information for your query: "${query}". 
      
      Here are some general suggestions:
      - Check the bank's official website for the most current information
      - Contact the bank's customer service for detailed terms and conditions
      - Consider visiting a bank branch for personalized advice
      
      You can also try rephrasing your question or ask about a specific credit card feature.`,
      source: 'fallback',
      confidence: 0.3,
      cards_recommended: [],
      followup_questions: [
        "Would you like to know about general credit card features?",
        "Do you need help understanding credit card terminology?"
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get fallback manager statistics
   */
  getStats() {
    return {
      maxAttempts: this.maxAttempts,
      confidenceThreshold: this.confidenceThreshold,
      lastUpdated: Date.now()
    };
  }
}

module.exports = new FallbackManager(); 