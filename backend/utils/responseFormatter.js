
const bankService = require('../services/bankService');

function formatFee(fee) {
  if (fee === 0 || fee === '0' || fee === null || fee === undefined) {
    return 'FREE';
  }
  return `₹${fee}`;
}

function extractCategoryBenefit(card, category) {
  const benefits = card.product_usps || [];
  const categoryKeywords = {
    'fuel': ['fuel', 'petrol', 'diesel', 'gas'],
    'travel': ['travel', 'airline', 'hotel', 'miles', 'lounge'],
    'dining': ['dining', 'restaurant', 'food'],
    'shopping': ['shopping', 'retail', 'online'],
    'cashback': ['cashback', 'cash back', 'rewards']
  };
  
  const keywords = categoryKeywords[category.toLowerCase()] || [];
  
  for (let benefit of benefits) {
    const text = `${benefit.header} ${benefit.description}`.toLowerCase();
    if (keywords.some(keyword => text.includes(keyword))) {
      return `${benefit.header} - ${benefit.description}`;
    }
  }
  
  return null;
}

function formatEnhancedBankKaroResponse(cards, query, analysis) {
  const topCards = cards.slice(0, analysis.isComparison ? 5 : 3);
  let response = "";
  
  if (analysis.isComparison) {
    response = "🔍 **Card Comparison Based on Your Query:**\n\n";
  } else if (analysis.categoryMentioned) {
    response = `💳 **Best Credit Cards for ${analysis.categoryMentioned.toUpperCase()}:**\n\n`;
  } else {
    response = "💳 **Recommended Credit Cards:**\n\n";
  }
  
  topCards.forEach((card, index) => {
    const bankInfo = bankService.getBankInfo(card.bank_id);
    
    response += `**${index + 1}. ${card.name}** by ${bankInfo.name}\n`;
    response += `   💰 **Fees:** Joining: ${formatFee(card.joining_fee)} | Annual: ${formatFee(card.annual_fee)}\n`;
    
    if (card.welcome_offer) {
      response += `   🎁 **Welcome Offer:** ${card.welcome_offer}\n`;
    }
    
    // Add key features
    if (card.product_usps && card.product_usps.length > 0) {
      const topFeature = card.product_usps[0];
      response += `   ⭐ **Key Benefit:** ${topFeature.header} - ${topFeature.description}\n`;
    }
    
    // Add category-specific highlights
    if (analysis.categoryMentioned) {
      const categoryBenefit = extractCategoryBenefit(card, analysis.categoryMentioned);
      if (categoryBenefit) {
        response += `   🏆 **${analysis.categoryMentioned.toUpperCase()} Benefit:** ${categoryBenefit}\n`;
      }
    }
    
    response += `\n`;
  });
  
  // Add personalized recommendations
  response += "📊 **Want Personalized Recommendations?**\n";
  response += "Share your monthly spending pattern and I'll calculate the best cards for your specific needs!\n\n";
  
  response += "✍️ **Need Content Creation?**\n";
  response += "I can help create social media posts, articles, or comparison content about these cards!";
  
  return response;
}

module.exports = {
  formatFee,
  extractCategoryBenefit,
  formatEnhancedBankKaroResponse
};
