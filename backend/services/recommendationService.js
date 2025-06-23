
const axios = require('axios');
const { API_ENDPOINTS } = require('../config/apiConfig');
const bankService = require('./bankService');

class RecommendationService {
  async getCardRecommendations(spendingData) {
    try {
      console.log('Processing spending-based recommendation:', spendingData);
      
      // Call the enhanced recommendation API
      const response = await axios.post(API_ENDPOINTS.CARD_RECOMMENDATION, spendingData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Enhance the response with bank mappings and detailed analysis
      const enhancedRecommendations = await this.enhanceRecommendations(response.data, spendingData);
      
      return {
        recommendations: enhancedRecommendations,
        spending_analysis: this.analyzeSpendingPattern(spendingData),
        source: "Research by BankKaro",
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Enhanced Recommendation API Error:', error);
      throw error;
    }
  }

  analyzeSpendingPattern(spending) {
    const totalMonthly = Object.keys(spending)
      .filter(key => !key.includes('annual') && !key.includes('quarterly'))
      .reduce((sum, key) => sum + (spending[key] || 0), 0);
    
    const totalAnnual = Object.keys(spending)
      .filter(key => key.includes('annual'))
      .reduce((sum, key) => sum + (spending[key] || 0), 0);
    
    const topCategories = Object.entries(spending)
      .filter(([key, value]) => value > 0 && !key.includes('quarterly'))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return {
      total_monthly: totalMonthly,
      total_annual: totalAnnual + (totalMonthly * 12),
      top_spending_categories: topCategories.map(([category, amount]) => ({
        category: category.replace(/_/g, ' ').toUpperCase(),
        amount: amount
      })),
      spending_profile: this.categorizeSpendingProfile(totalMonthly)
    };
  }

  categorizeSpendingProfile(monthlySpend) {
    if (monthlySpend < 20000) return 'Basic Spender';
    if (monthlySpend < 50000) return 'Moderate Spender';
    if (monthlySpend < 100000) return 'High Spender';
    return 'Premium Spender';
  }

  async enhanceRecommendations(recommendations, spendingData) {
    // Ensure bank mappings are loaded
    await bankService.ensureBankMappingsLoaded();
    
    // Process and enhance each recommendation
    if (recommendations && Array.isArray(recommendations)) {
      return recommendations.map(card => {
        const bankInfo = bankService.getBankInfo(card.bank_id);
        return {
          ...card,
          bank_info: bankInfo,
          personalized_benefits: this.calculatePersonalizedBenefits(card, spendingData)
        };
      });
    }
    
    return recommendations;
  }

  calculatePersonalizedBenefits(card, spending) {
    // Calculate estimated annual benefits based on spending pattern
    const benefits = [];
    
    // This is a simplified calculation - you can enhance based on actual card benefits
    if (spending.fuel && spending.fuel > 0) {
      benefits.push(`Estimated fuel savings: ₹${Math.round(spending.fuel * 12 * 0.05)}/year`);
    }
    
    if (spending.dining_or_going_out && spending.dining_or_going_out > 0) {
      benefits.push(`Estimated dining rewards: ₹${Math.round(spending.dining_or_going_out * 12 * 0.03)}/year`);
    }
    
    return benefits;
  }
}

module.exports = new RecommendationService();
