
const axios = require('axios');

async function testChatFlow() {
  const serverUrl = 'http://localhost:4000';
  
  console.log('🧪 Testing Chat Flow...\n');
  
  const testQueries = [
    'What are the best HDFC credit cards?',
    'Compare travel credit cards',
    'What is a credit score?',
    'Create social media post about credit cards'
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n${i + 1}. Testing: "${query}"`);
    
    try {
      const response = await axios.post(`${serverUrl}/api/chat`, {
        message: query,
        context: 'Test query'
      });
      
      console.log('✅ Response received');
      console.log('📋 Source:', response.data.source);
      console.log('💬 Preview:', response.data.response.substring(0, 100) + '...');
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
  }
  
  console.log('\n🎉 Chat flow test completed!');
}

// Test if server is running first
axios.get('http://localhost:4000/health')
  .then(() => {
    console.log('✅ Server is running');
    return testChatFlow();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start with: npm start');
  });
