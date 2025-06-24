
const axios = require('axios');
require('dotenv').config();

async function testCompleteSetup() {
  console.log('🚀 Testing Complete ChatGPT + BankKaro Setup...\n');
  
  // Test 1: Environment Variables
  console.log('📋 Step 1: Environment Variables');
  console.log('- PORT:', process.env.PORT || '4000');
  console.log('- BANKKARO_API_BASE:', process.env.BANKKARO_API_BASE ? '✅ Set' : '❌ Missing');
  console.log('- CARD_RECOMMENDATION_API:', process.env.CARD_RECOMMENDATION_API ? '✅ Set' : '❌ Missing');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log();

  // Test 2: Server Health
  console.log('📋 Step 2: Server Health Check');
  try {
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Server is running');
    console.log('📊 Health Status:', healthResponse.data);
    console.log();
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm start');
    return;
  }

  // Test 3: OpenAI Direct Test
  console.log('📋 Step 3: ChatGPT API Test');
  try {
    const openaiTestResponse = await axios.get('http://localhost:4000/api/test-openai');
    console.log('✅ ChatGPT API: Working');
    console.log('📝 Test Response:', openaiTestResponse.data.response.substring(0, 100) + '...');
    console.log();
  } catch (error) {
    console.log('❌ ChatGPT API Error:', error.response?.data?.error || error.message);
    console.log();
  }

  // Test 4: Chat Endpoint Test
  console.log('📋 Step 4: Chat Endpoint Test');
  const testQueries = [
    'What are the best credit cards in India?',
    'Compare HDFC and SBI credit cards',
    'How to improve credit score?',
    'Create a social media post about credit cards'
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n${i + 1}. Testing: "${query}"`);
    
    try {
      const response = await axios.post('http://localhost:4000/api/chat', {
        message: query,
        context: 'Test query for ChatGPT integration'
      });
      
      console.log('✅ Response received');
      console.log('📋 Source:', response.data.source);
      console.log('💬 Preview:', response.data.response.substring(0, 150) + '...');
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
  }

  // Test 5: BankKaro APIs (Optional)
  console.log('\n📋 Step 5: BankKaro API Status');
  try {
    const bankResponse = await axios.post(`${process.env.BANKKARO_API_BASE}/bank-tags`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Bank Tags API: Working');
    console.log('📊 Banks found:', bankResponse.data?.data?.banks?.length || 0);
  } catch (error) {
    console.log('⚠️ Bank Tags API: Not accessible (This is optional for ChatGPT-only mode)');
  }

  console.log('\n🎉 Complete setup test finished!');
  console.log('\n📌 Next Steps:');
  console.log('1. If ChatGPT API is working, your chat widget should work perfectly');
  console.log('2. Open your frontend and test the chat widget');
  console.log('3. If you see any errors, check the console logs');
  console.log('4. The chat widget now prioritizes ChatGPT responses as requested');
}

testCompleteSetup().catch(console.error);
