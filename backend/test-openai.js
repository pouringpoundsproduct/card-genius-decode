require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Please set your OpenAI API key in the .env file');
    return;
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'write a haiku about ai'
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('✅ OpenAI API test successful!');
    console.log('Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.response?.data || error.message);
  }
}

testOpenAI(); 