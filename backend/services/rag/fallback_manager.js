const { RAG_CONFIG } = require('../../config/rag_config');
const scoringSystem = require('./scoring');
const openaiService = require('../openaiService');
const vectorStore = require('./vector_store');
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
   * Try API tier (Tier 1) - Use vector store for API data
   */
  async tryAPITier(query, context) {
    try {
      console.log('🔍 Trying API tier...');
      
      // Check if query is credit card related
      const queryLower = query.toLowerCase();
      const creditCardKeywords = [
        'credit card', 'card', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'yes bank', 'indusind',
        'rewards', 'cashback', 'travel', 'lounge', 'annual fee', 'joining fee', 'benefits',
        'compare', 'best', 'top', 'list', 'details', 'information', 'features'
      ];
      
      const isCreditCardQuery = creditCardKeywords.some(keyword => queryLower.includes(keyword));
      
      if (!isCreditCardQuery) {
        console.log('❌ Query not credit card related, skipping API tier');
        return null;
      }
      
      // Search API data in vector store
      const apiResults = await vectorStore.searchAPIData(query, RAG_CONFIG.MAX_RETRIEVAL_RESULTS);
      
      console.log(`📊 API search results:`, apiResults.length);
      
      if (apiResults && apiResults.length > 0) {
        console.log(`📊 Found ${apiResults.length} relevant API results`);
        
        // Extract card data from vector store results
        const relevantCards = apiResults.map(result => result.data).filter(card => card);
        
        console.log(`📊 Relevant cards found:`, relevantCards.length);
        console.log(`📊 Sample card:`, relevantCards[0]?.name);
        
        if (relevantCards.length > 0) {
          // Check if the results are actually relevant to the query
          const relevanceScore = this.calculateRelevanceScore(query, relevantCards);
          console.log(`📊 Relevance score: ${relevanceScore.toFixed(2)}`);
          
          if (relevanceScore < 0.3) {
            console.log('❌ API results not relevant enough, trying next tier');
            return null;
          }
          
          const responseText = this.formatCardResponse(relevantCards, query);
          
          // Calculate confidence based on relevance and number of results
          const baseConfidence = Math.min(0.8, 0.4 + (relevantCards.length * 0.1));
          
          // Boost confidence for specific queries
          let confidence = baseConfidence;
          if (queryLower.includes('hdfc') || queryLower.includes('sbi') || queryLower.includes('icici')) {
            confidence += 0.2; // Boost for bank-specific queries
          }
          if (queryLower.includes('list') || queryLower.includes('top') || queryLower.includes('best')) {
            confidence += 0.1; // Boost for list/top queries
          }
          
          confidence = Math.min(confidence, 0.95); // Cap at 0.95
          
          console.log(`📊 API tier confidence: ${confidence.toFixed(2)}`);
          console.log(`📊 Confidence threshold: ${this.confidenceThreshold}`);
          
          if (confidence >= this.confidenceThreshold) {
            console.log('✅ API tier response accepted');
            return {
              answer: responseText,
              confidence,
              cards: relevantCards,
              source: 'api'
            };
          } else {
            console.log('❌ API tier confidence too low, trying next tier');
          }
        }
      }
      
      console.log('❌ No relevant API results found');
      return null;
    } catch (error) {
      console.error('❌ API tier failed:', error.message);
      return null;
    }
  }

  /**
   * Try MITC tier (Tier 2) - Use vector store for MITC documents
   */
  async tryMITCTier(query, context) {
    try {
      console.log('🔍 Trying MITC tier...');
      
      // Check if query is credit card related
      const queryLower = query.toLowerCase();
      const creditCardKeywords = [
        'credit card', 'card', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'yes bank', 'indusind',
        'rewards', 'cashback', 'travel', 'lounge', 'annual fee', 'joining fee', 'benefits',
        'compare', 'best', 'top', 'list', 'details', 'information', 'features', 'terms', 'conditions'
      ];
      
      const isCreditCardQuery = creditCardKeywords.some(keyword => queryLower.includes(keyword));
      
      if (!isCreditCardQuery) {
        console.log('❌ Query not credit card related, skipping MITC tier');
        return null;
      }
      
      // Search MITC documents in vector store
      const mitcResults = await vectorStore.searchMITCDocuments(query, RAG_CONFIG.MAX_RETRIEVAL_RESULTS);
      
      console.log(`📄 MITC search results:`, mitcResults.length);
      
      if (mitcResults && mitcResults.length > 0) {
        console.log(`📄 Found ${mitcResults.length} relevant MITC results`);
        
        // Combine MITC document content
        const mitcContent = mitcResults.map(result => result.text).join('\n\n');
        
        const mitcResponse = `Based on the MITC documents, here are the relevant terms and conditions for your query: "${query}"

${mitcContent}

Please note that specific terms may vary by card and are subject to change. For the most current information, 
please refer to the official bank documents or contact the bank directly.`;
        
        const confidence = Math.min(0.7, 0.4 + (mitcResults.length * 0.1));
        
        console.log(`📄 MITC tier confidence: ${confidence.toFixed(2)}`);
        
        if (confidence >= this.confidenceThreshold) {
          console.log('✅ MITC tier response accepted');
          return {
            answer: mitcResponse,
            confidence,
            source: 'mitc',
            documents: mitcResults.map(result => result.cardName)
          };
        } else {
          console.log('❌ MITC tier confidence too low, trying next tier');
        }
      } else {
        console.log('❌ No MITC documents found');
      }
      
      return null;
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
   * Calculate relevance score between query and cards
   */
  calculateRelevanceScore(query, cards) {
    const queryLower = query.toLowerCase();
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const card of cards) {
      let cardScore = 0;
      let cardMaxScore = 0;
      
      // Check card name relevance
      if (card.name) {
        cardMaxScore += 3;
        if (queryLower.includes(card.name.toLowerCase())) {
          cardScore += 3;
        } else if (card.name.toLowerCase().includes(queryLower)) {
          cardScore += 2;
        }
      }
      
      // Check bank name relevance
      if (card.bank_name) {
        cardMaxScore += 2;
        if (queryLower.includes(card.bank_name.toLowerCase())) {
          cardScore += 2;
        }
      }
      
      // Check for specific keywords in query
      const keywords = ['travel', 'cashback', 'rewards', 'lounge', 'free', 'premium', 'fuel', 'dining'];
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          cardMaxScore += 1;
          if (card.rewards && card.rewards.toLowerCase().includes(keyword)) {
            cardScore += 1;
          }
          if (card.benefits && card.benefits.toLowerCase().includes(keyword)) {
            cardScore += 1;
          }
        }
      }
      
      // Check for specific card types
      if (queryLower.includes('phonepe') && card.name && card.name.toLowerCase().includes('phonepe')) {
        cardScore += 5;
        cardMaxScore += 5;
      }
      
      if (cardMaxScore > 0) {
        totalScore += cardScore / cardMaxScore;
        maxPossibleScore += 1;
      }
    }
    
    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  }

  /**
   * Format card response
   */
  formatCardResponse(cards, query) {
    if (cards.length === 0) {
      return "I couldn't find any credit cards matching your criteria. Please try rephrasing your query or check with the bank directly.";
    }
    
    const queryLower = query.toLowerCase();
    const isListQuery = queryLower.includes('list') || queryLower.includes('top') || queryLower.includes('best');
    const isBankSpecific = queryLower.includes('hdfc') || queryLower.includes('sbi') || queryLower.includes('icici');
    
    // Determine how many cards to show
    let maxCards = 3;
    if (queryLower.includes('top 3') || queryLower.includes('top3')) {
      maxCards = 3;
    } else if (queryLower.includes('top 5') || queryLower.includes('top5')) {
      maxCards = 5;
    } else if (queryLower.includes('all') || queryLower.includes('complete')) {
      maxCards = cards.length;
    }
    
    let response = '';
    
    if (isListQuery) {
      response = `Here are the ${maxCards === cards.length ? 'available' : `top ${Math.min(maxCards, cards.length)}`} credit cards based on your query "${query}":\n\n`;
    } else {
      response = `Based on your query "${query}", here are some relevant credit cards:\n\n`;
    }
    
    for (let i = 0; i < Math.min(cards.length, maxCards); i++) {
      const card = cards[i];
      const bankName = card.bank_name || 'Unknown Bank';
      response += `${i + 1}. **${card.name}** (${bankName})\n`;
      
      if (card.annual_fee) {
        response += `   💳 Annual Fee: ${card.annual_fee}\n`;
      }
      
      if (card.rewards) {
        response += `   🎁 Rewards: ${card.rewards}\n`;
      }
      
      if (card.benefits) {
        response += `   ⭐ Benefits: ${card.benefits}\n`;
      }
      
      if (card.eligibility) {
        response += `   📋 Eligibility: ${card.eligibility}\n`;
      }
      
      response += '\n';
    }
    
    if (cards.length > maxCards) {
      response += `... and ${cards.length - maxCards} more cards available.\n\n`;
    }
    
    if (isBankSpecific) {
      response += "💡 **Tip**: For the most current information, offers, and to apply, please visit the respective bank's website or contact them directly.";
    } else {
      response += "For detailed information and to apply, please visit the respective bank's website or contact them directly.";
    }
    
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
