
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getChatGPTResponse(message, context) {
    const completion = await this.openai.chat.completions.create({
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
  }
}

module.exports = new OpenAIService();
