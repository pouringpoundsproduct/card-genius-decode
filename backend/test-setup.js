
const axios = require('axios');
require('dotenv').config();

async function testBackendSetup() {
  console.log('🚀 Testing Backend Setup...\n');
  
  // Test environment variables
  console.log('📋 Environment Variables:');
  console.log('- PORT:', process.env.PORT || '4000');
  console.log('- BANKKARO_API_BASE:', process.env.BANKKARO_API_BASE);
  console.log('- CARD_RECOMMENDATION_API:', process.env.CARD_RECOMMENDATION_API);
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Missing ❌');
  console.log();

  // Test BankKaro APIs
  try {
    console.log('🏦 Testing BankKaro Bank Tags API...');
    const bankResponse = await axios.post(`${process.env.BANKKARO_API_BASE}/bank-tags`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Bank Tags API: Working');
    console.log('📊 Banks found:', bankResponse.data?.data?.banks?.length || 0);
  } catch (error) {
    console.log('❌ Bank Tags API Error:', error.response?.status, error.response?.data?.message);
  }

  try {
    console.log('\n💳 Testing BankKaro Cards API...');
    const cardsResponse = await axios.post(`${process.env.BANKKARO_API_BASE}/cards`, {
      slug: "",
      banks_ids: [],
      card_networks: [],
      annualFees: "",
      credit_score: "",
      sort_by: "",
      free_cards: "",
      eligiblityPayload: {},
      cardGeniusPayload: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Cards API: Working');
    console.log('📊 Cards found:', cardsResponse.data?.data?.cards?.length || 0);
  } catch (error) {
    console.log('❌ Cards API Error:', error.response?.status, error.response?.data?.message);
  }

  // Test OpenAI
  try {
    console.log('\n🤖 Testing OpenAI API...');
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello, this is a test message." }],
      max_tokens: 50,
    });
    
    console.log('✅ OpenAI API: Working');
    console.log('📝 Test response:', completion.choices[0].message.content.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ OpenAI API Error:', error.message);
  }

  console.log('\n🎉 Backend setup test completed!');
}

testBackendSetup().catch(console.error);
