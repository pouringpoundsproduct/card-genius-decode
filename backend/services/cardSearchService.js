
const axios = require('axios');
const { API_ENDPOINTS } = require('../config/apiConfig');
const bankService = require('./bankService');
const { analyzeQuery, generateSlugFromQuery } = require('../utils/queryAnalyzer');
const { formatEnhancedBankKaroResponse } = require('../utils/responseFormatter');

class CardSearchService {
  async searchBankKaroKnowledge(query) {
    try {
      // Ensure bank mappings are loaded
      await bankService.ensureBankMappingsLoaded();
      
      const analysis = analyzeQuery(query);
      console.log('Query analysis:', analysis);
      
      if (!analysis.isCardQuery) {
        return null; // Let ChatGPT handle non-card queries
      }
      
      // Enhanced search payload based on query analysis
      const searchPayload = {
        slug: generateSlugFromQuery(query),
        banks_ids: [],
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "popularity",
        free_cards: query.toLowerCase().includes('free') ? "1" : "",
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      // Add bank filter if specific bank mentioned
      if (analysis.bankMentioned) {
        const bankId = bankService.findBankIdByName(analysis.bankMentioned);
        if (bankId) {
          searchPayload.banks_ids = [parseInt(bankId)];
        }
      }

      console.log('Enhanced search payload:', searchPayload);
      
      const cardsResponse = await axios.post(API_ENDPOINTS.CARDS, searchPayload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (cardsResponse.data && cardsResponse.data.data && cardsResponse.data.data.cards && cardsResponse.data.data.cards.length > 0) {
        return formatEnhancedBankKaroResponse(cardsResponse.data.data.cards, query, analysis);
      }
      
      return null;
    } catch (error) {
      console.error('Enhanced BankKaro API Error:', error.message);
      return null;
    }
  }

  async buildEnhancedContext(message, analysis) {
    let context = "You are an expert credit card advisor for the Indian market. ";
    
    if (analysis.isCardQuery) {
      context += "Focus on providing accurate information about Indian credit cards, their benefits, eligibility, and recommendations. ";
    }
    
    const bankCache = bankService.getBankCache();
    if (bankCache && bankCache.banks) {
      const bankNames = bankCache.banks.map(bank => bank.name).join(", ");
      context += `Available banks in India: ${bankNames}. `;
    }
    
    if (analysis.categoryMentioned) {
      context += `The user is specifically interested in ${analysis.categoryMentioned} category cards. `;
    }
    
    context += "Provide practical, actionable advice and always mention that for the most current and detailed information, users should verify with the respective banks.";
    
    return context;
  }
}

module.exports = new CardSearchService();
