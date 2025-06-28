const axios = require('axios');
const { RAG_CONFIG } = require('../config/rag_config');

class OpenAIService {
  constructor() {
    this.apiKey = RAG_CONFIG.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async getChatGPTResponse(message, context) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: RAG_CONFIG.OPENAI_MODEL,
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
        max_tokens: RAG_CONFIG.OPENAI_MAX_TOKENS,
        temperature: RAG_CONFIG.OPENAI_TEMPERATURE,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleContentCreation(message, context) {
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
    
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: RAG_CONFIG.OPENAI_MODEL,
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
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Content Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
