
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

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(API_ENDPOINTS)
  });
});

// Main Chat Interface
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // First try to get answer from BankKaro API
    let bankKaroResponse = await searchBankKaroKnowledge(message);
    
    if (bankKaroResponse) {
      return res.json({
        response: bankKaroResponse,
        source: "Research by BankKaro",
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback to ChatGPT
    const chatGPTResponse = await getChatGPTResponse(message, context);
    
    res.json({
      response: chatGPTResponse,
      source: "Research by ChatGPT",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error.message 
    });
  }
});

// Card Recommendation API
app.post('/api/recommend-cards', async (req, res) => {
  try {
    const spendingData = req.body;
    
    // Use the new card recommendation API
    const response = await axios.post(API_ENDPOINTS.CARD_RECOMMENDATION, spendingData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    res.json({
      recommendations: response.data,
      source: "Research by BankKaro",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Recommendation API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get card recommendations',
      message: error.message 
    });
  }
});

// Content Creation API
app.post('/api/create-content', async (req, res) => {
  try {
    const { topic, contentType, userResponses } = req.body;
    
    // Check if we need more information from user
    const requiredInfo = getRequiredContentInfo(contentType);
    const missingInfo = requiredInfo.filter(info => !userResponses[info]);
    
    if (missingInfo.length > 0) {
      return res.json({
        needsMoreInfo: true,
        questions: generateClarifyingQuestions(missingInfo),
        source: "Content Creation Assistant"
      });
    }
    
    // Generate content based on complete user responses
    const content = await generateContent(topic, contentType, userResponses);
    
    res.json({
      content: content,
      source: "Research by ChatGPT",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Content Creation Error:', error);
    res.status(500).json({ 
      error: 'Failed to create content',
      message: error.message 
    });
  }
});

// Helper Functions
async function searchBankKaroKnowledge(query) {
  try {
    // Search in bank-tags first
    const tagsResponse = await axios.post(API_ENDPOINTS.BANK_TAGS, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Search in cards with enhanced query handling
    const searchPayload = {
      slug: generateSlugFromQuery(query),
      banks_ids: [],
      card_networks: [],
      annualFees: "",
      credit_score: "",
      sort_by: "",
      free_cards: "",
      eligiblityPayload: {},
      cardGeniusPayload: {}
    };

    const cardsResponse = await axios.post(API_ENDPOINTS.CARDS, searchPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Process and filter results based on query
    if (cardsResponse.data && cardsResponse.data.data && cardsResponse.data.data.cards && cardsResponse.data.data.cards.length > 0) {
      return formatBankKaroResponse(cardsResponse.data.data.cards, query);
    }
    
    return null;
  } catch (error) {
    console.error('BankKaro API Error:', error);
    return null;
  }
}

function generateSlugFromQuery(query) {
  // Convert query to potential slug format
  return query.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getChatGPTResponse(message, context) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a helpful credit card expert assistant. Provide accurate, helpful information about credit cards, banking, and financial topics. Focus on practical advice and recommendations."
      },
      {
        role: "user",
        content: context ? `Context: ${context}\n\nQuestion: ${message}` : message
      }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

function formatBankKaroResponse(cards, query) {
  // Enhanced formatting based on query type
  const topCards = cards.slice(0, 3);
  let response = "Based on our database, here are some relevant credit cards:\n\n";
  
  topCards.forEach((card, index) => {
    response += `${index + 1}. **${card.name}** by ${card.bank_name}\n`;
    response += `   - Joining Fee: ${card.joining_fee === 0 ? 'FREE' : '₹' + card.joining_fee}\n`;
    response += `   - Annual Fee: ${card.annual_fee === 0 ? 'FREE' : '₹' + card.annual_fee}\n`;
    
    if (card.welcome_offer) {
      response += `   - Welcome Offer: ${card.welcome_offer}\n`;
    }
    
    // Add key features if available
    if (card.product_usps && card.product_usps.length > 0) {
      response += `   - Key Feature: ${card.product_usps[0].header}\n`;
    }
    
    response += `\n`;
  });
  
  response += "Would you like more details about any of these cards or need recommendations based on your specific spending patterns?";
  
  return response;
}

function getRequiredContentInfo(contentType) {
  const infoMap = {
    'article': ['target_audience', 'article_length', 'key_points'],
    'social_post': ['platform', 'tone', 'call_to_action'],
    'email': ['email_type', 'target_audience', 'main_message']
  };
  
  return infoMap[contentType] || ['target_audience', 'main_message'];
}

function generateClarifyingQuestions(missingInfo) {
  const questionMap = {
    'target_audience': "Who is your target audience?",
    'article_length': "How long should the article be? (short/medium/long)",
    'key_points': "What key points should be covered?",
    'platform': "Which social media platform? (Facebook/Twitter/LinkedIn/Instagram)",
    'tone': "What tone should the content have? (professional/casual/friendly)",
    'call_to_action': "What action do you want readers to take?",
    'email_type': "What type of email? (promotional/informational/newsletter)",
    'main_message': "What's the main message you want to convey?"
  };
  
  return missingInfo.map(info => questionMap[info] || `Please provide information about: ${info}`);
}

async function generateContent(topic, contentType, userResponses) {
  const prompt = `Create ${contentType} content about ${topic} with the following specifications:
    ${Object.entries(userResponses).map(([key, value]) => `${key}: ${value}`).join('\n')}
    
    Make it engaging, informative, and tailored to the specified audience. Focus on credit card benefits, features, and practical advice.`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional content creator specializing in financial and credit card content. Create high-quality, informative content that helps users make better financial decisions."
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

// Start Server
app.listen(PORT, () => {
  console.log(`Credit+ MCP Server running on http://localhost:${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log('API Endpoints configured:');
  console.log('- Bank Tags:', API_ENDPOINTS.BANK_TAGS);
  console.log('- Cards:', API_ENDPOINTS.CARDS);
  console.log('- Card Recommendation:', API_ENDPOINTS.CARD_RECOMMENDATION);
});
