
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// API Endpoints Configuration
const API_ENDPOINTS = {
  BANK_TAGS: `${process.env.BANKKARO_API_BASE}/bank-tags`,
  CARDS: `${process.env.BANKKARO_API_BASE}/cards`,
  CARD_RECOMMENDATION: process.env.CARD_RECOMMENDATION_API
};

// Cache for bank data and mappings
let bankCache = null;
let bankMappings = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(API_ENDPOINTS),
    cache_status: bankCache ? 'loaded' : 'empty'
  });
});

// Initialize bank mappings
async function initializeBankMappings() {
  try {
    console.log('Initializing bank mappings...');
    const response = await axios.post(API_ENDPOINTS.BANK_TAGS, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data && response.data.data && response.data.data.banks) {
      bankCache = response.data.data;
      bankMappings.clear();
      
      response.data.data.banks.forEach(bank => {
        bankMappings.set(bank.id.toString(), {
          name: bank.name,
          logo: bank.logo || '',
          ...bank
        });
      });
      
      lastCacheUpdate = Date.now();
      console.log(`Bank mappings initialized: ${bankMappings.size} banks loaded`);
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize bank mappings:', error.message);
    return false;
  }
}

// Get bank info by ID
function getBankInfo(bankId) {
  const id = bankId?.toString();
  return bankMappings.get(id) || { name: 'Unknown Bank', logo: '' };
}

// Enhanced query analyzer
function analyzeQuery(query) {
  const queryLower = query.toLowerCase();
  
  const patterns = {
    cardSearch: /\b(card|credit card|best card|recommend|suggestion)\b/i,
    bankSpecific: /\b(hdfc|sbi|axis|icici|kotak|indusind|american express|amex)\b/i,
    categorySpecific: /\b(fuel|travel|cashback|dining|shopping|grocery|lounge)\b/i,
    comparison: /\b(compare|vs|versus|difference|better)\b/i,
    spending: /\b(spend|spending|calculate|recommendation|budget)\b/i,
    content: /\b(content|article|post|write|create|blog|social media)\b/i
  };
  
  return {
    isCardQuery: patterns.cardSearch.test(queryLower) || patterns.bankSpecific.test(queryLower) || patterns.categorySpecific.test(queryLower),
    isComparison: patterns.comparison.test(queryLower),
    isSpendingQuery: patterns.spending.test(queryLower),
    isContentQuery: patterns.content.test(queryLower),
    bankMentioned: queryLower.match(patterns.bankSpecific)?.[0] || null,
    categoryMentioned: queryLower.match(patterns.categorySpecific)?.[0] || null
  };
}

// Enhanced BankKaro knowledge search
async function searchBankKaroKnowledge(query) {
  try {
    // Ensure bank mappings are loaded
    if (!bankCache || Date.now() - lastCacheUpdate > CACHE_DURATION) {
      await initializeBankMappings();
    }
    
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
      const bankId = findBankIdByName(analysis.bankMentioned);
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

// Find bank ID by name
function findBankIdByName(bankName) {
  const name = bankName.toLowerCase();
  for (let [id, bank] of bankMappings) {
    if (bank.name.toLowerCase().includes(name) || name.includes(bank.name.toLowerCase().split(' ')[0])) {
      return id;
    }
  }
  return null;
}

// Enhanced response formatting
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
    const bankInfo = getBankInfo(card.bank_id);
    
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

// Extract category-specific benefits
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

// Format fees display
function formatFee(fee) {
  if (fee === 0 || fee === '0' || fee === null || fee === undefined) {
    return 'FREE';
  }
  return `₹${fee}`;
}

// Main Chat Interface with Enhanced Intelligence
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    console.log('Received chat request:', message);
    
    const analysis = analyzeQuery(message);
    
    // Handle content creation queries
    if (analysis.isContentQuery) {
      const contentResponse = await handleContentCreation(message, context);
      return res.json({
        response: contentResponse,
        source: "Content Creation Assistant",
        timestamp: new Date().toISOString()
      });
    }
    
    // Try BankKaro APIs first for card-related queries
    let bankKaroResponse = await searchBankKaroKnowledge(message);
    
    if (bankKaroResponse) {
      return res.json({
        response: bankKaroResponse,
        source: "Research by BankKaro",
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback to ChatGPT with enhanced context
    const enhancedContext = await buildEnhancedContext(message, analysis);
    const chatGPTResponse = await getChatGPTResponse(message, enhancedContext);
    
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
    console.log('Processing spending-based recommendation:', spendingData);
    
    // Call the enhanced recommendation API
    const response = await axios.post(API_ENDPOINTS.CARD_RECOMMENDATION, spendingData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Enhance the response with bank mappings and detailed analysis
    const enhancedRecommendations = await enhanceRecommendations(response.data, spendingData);
    
    res.json({
      recommendations: enhancedRecommendations,
      spending_analysis: analyzeSpendingPattern(spendingData),
      source: "Research by BankKaro",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhanced Recommendation API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get card recommendations',
      message: error.message 
    });
  }
});

// Spending Pattern Analysis
function analyzeSpendingPattern(spending) {
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
    spending_profile: categorizeSpendingProfile(totalMonthly)
  };
}

function categorizeSpendingProfile(monthlySpend) {
  if (monthlySpend < 20000) return 'Basic Spender';
  if (monthlySpend < 50000) return 'Moderate Spender';
  if (monthlySpend < 100000) return 'High Spender';
  return 'Premium Spender';
}

// Enhanced Content Creation Handler
async function handleContentCreation(message, context) {
  const contentTypes = {
    'social media': 'social_post',
    'instagram': 'social_post',
    'twitter': 'social_post',
    'article': 'article',
    'blog': 'article',
    'email': 'email',
    'newsletter': 'email'
  };
  
  let contentType = 'article'; // default
  for (let [key, value] of Object.entries(contentTypes)) {
    if (message.toLowerCase().includes(key)) {
      contentType = value;
      break;
    }
  }
  
  const prompt = `Create engaging ${contentType} content about credit cards in India. 
    Focus on: ${message}
    
    Requirements:
    - Target audience: Credit card users and influencers in India
    - Include practical benefits and real-world examples
    - Make it engaging and shareable
    - Include relevant hashtags if it's social media content
    - Focus on Indian credit card market and benefits
    
    Content should be informative, actionable, and help readers make better financial decisions.`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional content creator specializing in Indian credit card and fintech content. Create engaging, informative content that helps users make better financial decisions. Always include practical tips and real examples relevant to the Indian market."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.8,
  });
  
  return completion.choices[0].message.content;
}

// Build enhanced context for ChatGPT
async function buildEnhancedContext(message, analysis) {
  let context = "You are an expert credit card advisor for the Indian market. ";
  
  if (analysis.isCardQuery) {
    context += "Focus on providing accurate information about Indian credit cards, their benefits, eligibility, and recommendations. ";
  }
  
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

// Enhanced ChatGPT Response
async function getChatGPTResponse(message, context) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: context || "You are a helpful credit card expert assistant focusing on the Indian market. Provide accurate, helpful information about credit cards, banking, and financial topics. Focus on practical advice and recommendations suitable for Indian users."
      },
      {
        role: "user",
        content: message
      }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

// Enhance recommendations with bank info
async function enhanceRecommendations(recommendations, spendingData) {
  // Ensure bank mappings are loaded
  if (!bankCache) {
    await initializeBankMappings();
  }
  
  // Process and enhance each recommendation
  if (recommendations && Array.isArray(recommendations)) {
    return recommendations.map(card => {
      const bankInfo = getBankInfo(card.bank_id);
      return {
        ...card,
        bank_info: bankInfo,
        personalized_benefits: calculatePersonalizedBenefits(card, spendingData)
      };
    });
  }
  
  return recommendations;
}

function calculatePersonalizedBenefits(card, spending) {
  // Calculate estimated annual benefits based on spending pattern
  let estimatedBenefits = 0;
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

function generateSlugFromQuery(query) {
  return query.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Initialize bank mappings on server start
initializeBankMappings();

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
