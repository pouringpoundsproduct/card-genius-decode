
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getChatGPTResponse(message, context) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: context || "You are a helpful credit card expert assistant focusing on the Indian market. Provide accurate, helpful information about credit cards, banking, and financial topics. Focus on practical advice and recommendations suitable for Indian users. Always provide specific, actionable insights."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
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
      const completion = await this.openai.chat.completions.create({
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
    } catch (error) {
      console.error('Content Creation Error:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello, this is a test message." }],
        max_tokens: 50,
      });
      
      return {
        status: 'success',
        response: completion.choices[0].message.content,
        model: 'gpt-4'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new OpenAIService();
