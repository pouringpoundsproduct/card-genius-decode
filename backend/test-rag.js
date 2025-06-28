const retrievalService = require('./services/rag/retrieval');
const vectorStore = require('./services/rag/vector_store');
const scoringSystem = require('./services/rag/scoring');
const pdfProcessor = require('./services/rag/pdf_processor');

async function testRAGSystem() {
  console.log('🧪 Testing RAG System Components...\n');

  try {
    // Test 1: Initialize RAG System
    console.log('1. Testing RAG System Initialization...');
    await retrievalService.initialize();
    console.log('✅ RAG System initialized successfully\n');

    // Test 2: Vector Store Operations
    console.log('2. Testing Vector Store Operations...');
    const vectorStats = vectorStore.getStats();
    console.log('Vector Store Stats:', vectorStats);
    console.log('✅ Vector Store operations working\n');

    // Test 3: Scoring System
    console.log('3. Testing Scoring System...');
    const testQuery = "Best travel credit cards";
    const testResponse = "Here are some excellent travel credit cards with lounge access...";
    const confidence = scoringSystem.calculateConfidenceScore(testQuery, testResponse, 'api');
    console.log('Confidence Score:', confidence);
    console.log('✅ Scoring system working\n');

    // Test 4: PDF Processor
    console.log('4. Testing PDF Processor...');
    const mitcStats = await pdfProcessor.getDocumentStats();
    console.log('MITC Document Stats:', mitcStats);
    console.log('✅ PDF Processor working\n');

    // Test 5: System Statistics
    console.log('5. Testing System Statistics...');
    const systemStats = retrievalService.getSystemStats();
    console.log('System Stats:', JSON.stringify(systemStats, null, 2));
    console.log('✅ System statistics working\n');

    // Test 6: Sample Query Processing
    console.log('6. Testing Query Processing...');
    const testQueries = [
      "Best credit cards for online shopping",
      "Travel cards with lounge access",
      "Compare HDFC Regalia and ICICI Amazon Pay"
    ];

    for (const query of testQueries) {
      console.log(`\nProcessing query: "${query}"`);
      const response = await retrievalService.processQuery(query, 'test-user');
      console.log(`Response source: ${response.source}`);
      console.log(`Confidence: ${response.confidence.toFixed(2)}`);
      console.log(`Response preview: ${response.answer.substring(0, 100)}...`);
    }

    console.log('\n✅ All RAG System tests completed successfully!');
    console.log('\n🎉 RAG System is ready for use!');

  } catch (error) {
    console.error('❌ RAG System test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRAGSystem(); 