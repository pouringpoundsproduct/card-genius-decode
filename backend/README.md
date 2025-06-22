
# Credit+ MCP Server Setup

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env` file and add your OpenAI API key
   - Update `OPENAI_API_KEY=your_openai_api_key_here`

3. **Start Server**
   ```bash
   npm start
   ```
   Server runs on http://localhost:4000

4. **Test Setup**
   - Health check: http://localhost:4000/health
   - Chat widget appears in bottom-right of your app

## API Endpoints

- `POST /api/chat` - Main chat interface
- `POST /api/recommend-cards` - Card recommendations
- `POST /api/create-content` - Content creation
- `GET /health` - Health check

## Features

- **Knowledge Base First**: Searches BankKaro API before ChatGPT
- **Card Recommendations**: Personalized based on spending patterns
- **Content Creation**: Interactive content generation
- **Source Attribution**: Shows "Research by BankKaro" or "Research by ChatGPT"

## Troubleshooting

- Ensure port 4000 is available
- Check OpenAI API key in .env file
- Verify BankKaro API endpoints are accessible
- Check browser console for CORS issues
