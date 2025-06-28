# RAG-based AI Chatbot for Credit Card Recommendation System

## 🚀 Overview

This implementation provides a comprehensive RAG (Retrieval-Augmented Generation) chatbot system for credit card recommendations. The system uses a three-tier response architecture with intelligent fallback mechanisms to provide accurate, contextual responses to user queries about credit cards.

## 🏗️ Architecture

### Three-Tier Response System

1. **Tier 1: API Data (Primary Source)**
   - Real-time credit card data from BankKaro API
   - Structured card information with features, benefits, and eligibility
   - Highest priority for card-specific queries

2. **Tier 2: MITC Documents (Secondary Source)**
   - PDF documents containing terms and conditions
   - Detailed policy information and fine print
   - Used when API data doesn't fully satisfy the query

3. **Tier 3: OpenAI API (Fallback)**
   - External knowledge for general questions
   - Contextual responses when local sources are insufficient
   - Handles complex queries and explanations

### Core Components

```
backend/services/rag/
├── vector_store.js          # Vector database management
├── embeddings.js           # Text embedding generation
├── retrieval.js            # Main RAG orchestration
├── scoring.js              # Response quality scoring
├── fallback_manager.js     # Three-tier fallback logic
└── pdf_processor.js        # MITC document processing
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Required environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# RAG Configuration
RAG_CONFIDENCE_THRESHOLD=0.7
VECTOR_DB_DIMENSION=1536
MAX_RETRIEVAL_RESULTS=5

# API Configuration
BANKKARO_API_BASE=https://bk-api.bankkaro.com/sp/api
```

### 3. MITC Documents Setup

Create the MITC documents directory structure:

```bash
mkdir -p card-mitc-documents
```

Add PDF documents for each credit card:

```
card-mitc-documents/
├── HDFC Regalia/
│   └── mitc_terms.pdf
├── ICICI Amazon Pay/
│   └── mitc_terms.pdf
└── SBI SimplyCLICK/
    └── mitc_terms.pdf
```

### 4. Start the Backend Server

```bash
cd backend
npm start
```

The server will be available at `http://localhost:4000`

## 📡 API Endpoints

### Chat Endpoints

#### POST `/api/chat`
Main chat interface with RAG integration

**Request:**
```json
{
  "message": "Best travel credit cards with lounge access",
  "userId": "user123",
  "context": {}
}
```

**Response:**
```json
{
  "response": "Based on your query, here are some excellent travel credit cards...",
  "source": "api",
  "confidence": 0.85,
  "cards_recommended": [...],
  "followup_questions": [...],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### POST `/api/rag/chat`
Dedicated RAG chat endpoint

**Request:**
```json
{
  "query": "Compare HDFC Regalia vs ICICI Amazon Pay",
  "userId": "user123",
  "context": {}
}
```

### Feedback System

#### POST `/api/rag/feedback`
Record user feedback for response quality

**Request:**
```json
{
  "query": "Best travel credit cards",
  "response": "Here are some travel cards...",
  "source": "api",
  "rating": 4,
  "feedback": "Very helpful response"
}
```

### Admin Endpoints

#### GET `/api/rag/status`
Get system statistics and health

#### POST `/api/admin/rag/refresh`
Refresh vector databases with new data

#### POST `/api/admin/rag/reset`
Reset scoring system and conversation history

#### POST `/api/admin/rag/threshold`
Update confidence threshold

**Request:**
```json
{
  "threshold": 0.8
}
```

#### GET `/api/admin/mitc/stats`
Get MITC document statistics

#### POST `/api/admin/mitc/sample`
Create sample MITC document structure

## 🎯 Usage Examples

### 1. Basic Card Query
```bash
curl -X POST http://localhost:4000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Best credit cards for online shopping",
    "userId": "user123"
  }'
```

### 2. Specific Card Comparison
```bash
curl -X POST http://localhost:4000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Compare HDFC Regalia and ICICI Amazon Pay annual fees",
    "userId": "user123"
  }'
```

### 3. Travel Card Recommendations
```bash
curl -X POST http://localhost:4000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Travel credit cards with lounge access under 5000 annual fee",
    "userId": "user123"
  }'
```

## 🔧 Configuration Options

### Scoring System

The system uses an adaptive scoring mechanism with configurable weights:

- **API Score Weight**: 0.4 (default)
- **MITC Score Weight**: 0.35 (default)
- **OpenAI Score Weight**: 0.25 (default)

### Confidence Thresholds

- **Default Threshold**: 0.7
- **Minimum Threshold**: 0.1
- **Maximum Threshold**: 1.0

### Vector Database

- **Dimension**: 1536 (configurable)
- **Max Results**: 5 (configurable)
- **Storage**: In-memory (can be extended to persistent storage)

## 📊 Monitoring and Analytics

### System Statistics

Access system statistics via `/api/rag/status`:

```json
{
  "system": {
    "isInitialized": true,
    "activeUsers": 5,
    "totalConversations": 25
  },
  "vectorStore": {
    "apiVectorCount": 150,
    "mitcVectorCount": 45,
    "totalVectors": 195
  },
  "scoring": {
    "confidenceThreshold": 0.7,
    "scoreWeights": {...},
    "feedbackCount": 12,
    "averageUserRating": 4.2
  }
}
```

### Performance Metrics

- **Response Time**: < 3 seconds (target)
- **Confidence Score**: 0.7+ (target)
- **Fallback Rate**: < 20% (target)

## 🔄 Learning and Improvement

### Feedback Collection

The system automatically collects user feedback to improve response quality:

1. **Star Rating**: 1-5 star ratings for each response
2. **Source Tracking**: Tracks which tier provided the response
3. **Adaptive Weights**: Adjusts scoring weights based on feedback

### Self-Learning Features

- **Threshold Adjustment**: Automatically adjusts confidence thresholds
- **Weight Optimization**: Optimizes source weights based on performance
- **Query Pattern Recognition**: Learns from conversation history

## 🚨 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key configuration
   - Verify rate limits
   - Ensure model availability

2. **Vector Database Issues**
   - Check embedding model initialization
   - Verify document processing
   - Monitor memory usage

3. **MITC Document Processing**
   - Ensure PDF files are readable
   - Check file permissions
   - Verify directory structure

### Debug Mode

Enable debug logging by setting:

```env
ENABLE_DEBUG=true
LOG_LEVEL=debug
```

### Health Checks

Monitor system health:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/rag/status
```

## 🔮 Future Enhancements

### Planned Features

1. **Persistent Vector Storage**
   - Database integration (PostgreSQL, Redis)
   - Vector similarity search optimization

2. **Advanced NLP**
   - Intent classification
   - Entity extraction
   - Sentiment analysis

3. **Multi-language Support**
   - Hindi language support
   - Regional language processing

4. **Real-time Updates**
   - WebSocket integration
   - Live conversation streaming

5. **Advanced Analytics**
   - User behavior tracking
   - Response quality metrics
   - A/B testing framework

## 📝 Development Guidelines

### Code Structure

- **Services**: Business logic in `/services/rag/`
- **Utils**: Helper functions in `/utils/vectorization/`
- **Config**: Configuration in `/config/rag_config.js`
- **API**: Endpoints in `server.js`

### Testing

```bash
# Unit tests (to be implemented)
npm test

# Integration tests (to be implemented)
npm run test:integration
```

### Code Quality

- ESLint configuration
- Prettier formatting
- TypeScript support (frontend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review system logs
3. Create an issue with detailed information
4. Contact the development team

---

**Note**: This RAG system is designed for educational and demonstration purposes. For production use, ensure proper security measures, data privacy compliance, and scalability considerations. 