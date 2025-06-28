const { RAG_CONFIG } = require('../../config/rag_config');
const { generateEmbeddings } = require('../../utils/vectorization/embeddings');

class VectorStore {
  constructor() {
    this.apiVectorDB = new Map(); // API data vector database
    this.mitcVectorDB = new Map(); // MITC documents vector database
    this.metadata = new Map(); // Store metadata for each vector
    this.isInitialized = false;
  }

  /**
   * Initialize the vector store
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Vector Store...');
      this.isInitialized = true;
      console.log('✅ Vector Store initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Vector Store:', error);
      throw error;
    }
  }

  /**
   * Add API data to vector database
   */
  async addAPIData(cards) {
    try {
      console.log(`📊 Adding ${cards.length} cards to API vector database...`);
      
      for (const card of cards) {
        const cardText = this.extractCardText(card);
        const embedding = await generateEmbeddings(cardText);
        
        const vectorId = `api_${card.id || card.name}`;
        this.apiVectorDB.set(vectorId, embedding);
        this.metadata.set(vectorId, {
          type: 'api',
          card: card,
          text: cardText,
          timestamp: Date.now()
        });
      }
      
      console.log(`✅ Added ${cards.length} cards to API vector database`);
    } catch (error) {
      console.error('❌ Error adding API data to vector database:', error);
      throw error;
    }
  }

  /**
   * Add MITC document to vector database
   */
  async addMITCDocument(cardName, documentText, documentPath) {
    try {
      console.log(`📄 Adding MITC document for ${cardName} to vector database...`);
      
      // Split document into chunks for better retrieval
      const chunks = this.chunkText(documentText, 1000);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbeddings(chunk);
        
        const vectorId = `mitc_${cardName}_${i}`;
        this.mitcVectorDB.set(vectorId, embedding);
        this.metadata.set(vectorId, {
          type: 'mitc',
          cardName: cardName,
          text: chunk,
          chunkIndex: i,
          documentPath: documentPath,
          timestamp: Date.now()
        });
      }
      
      console.log(`✅ Added MITC document for ${cardName} (${chunks.length} chunks)`);
    } catch (error) {
      console.error('❌ Error adding MITC document to vector database:', error);
      throw error;
    }
  }

  /**
   * Search in API vector database
   */
  async searchAPI(query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS) {
    try {
      const queryEmbedding = await generateEmbeddings(query);
      const results = [];
      
      for (const [vectorId, embedding] of this.apiVectorDB.entries()) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        results.push({
          vectorId,
          similarity,
          metadata: this.metadata.get(vectorId)
        });
      }
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error searching API vector database:', error);
      return [];
    }
  }

  /**
   * Search API data with enhanced results
   */
  async searchAPIData(query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS) {
    try {
      const results = await this.searchAPI(query, limit);
      
      // Enhance results with card data
      return results.map(result => ({
        ...result,
        data: result.metadata?.card || null,
        text: result.metadata?.text || '',
        cardName: result.metadata?.card?.name || '',
        bankName: result.metadata?.card?.bank_name || ''
      }));
    } catch (error) {
      console.error('❌ Error searching API data:', error);
      return [];
    }
  }

  /**
   * Search in MITC vector database
   */
  async searchMITC(query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS) {
    try {
      const queryEmbedding = await generateEmbeddings(query);
      const results = [];
      
      for (const [vectorId, embedding] of this.mitcVectorDB.entries()) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        results.push({
          vectorId,
          similarity,
          metadata: this.metadata.get(vectorId)
        });
      }
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error searching MITC vector database:', error);
      return [];
    }
  }

  /**
   * Search MITC documents with enhanced results
   */
  async searchMITCDocuments(query, limit = RAG_CONFIG.MAX_RETRIEVAL_RESULTS) {
    try {
      const results = await this.searchMITC(query, limit);
      
      // Enhance results with document data
      return results.map(result => ({
        ...result,
        text: result.metadata?.text || '',
        cardName: result.metadata?.cardName || '',
        documentPath: result.metadata?.documentPath || '',
        chunkIndex: result.metadata?.chunkIndex || 0
      }));
    } catch (error) {
      console.error('❌ Error searching MITC documents:', error);
      return [];
    }
  }

  /**
   * Extract text from card data for vectorization
   */
  extractCardText(card) {
    const textParts = [];
    
    if (card.name) textParts.push(`Card: ${card.name}`);
    if (card.bank_name) textParts.push(`Bank: ${card.bank_name}`);
    if (card.card_type) textParts.push(`Type: ${card.card_type}`);
    if (card.annual_fee) textParts.push(`Annual Fee: ${card.annual_fee}`);
    if (card.credit_score) textParts.push(`Credit Score: ${card.credit_score}`);
    if (card.rewards) textParts.push(`Rewards: ${card.rewards}`);
    if (card.benefits) textParts.push(`Benefits: ${card.benefits}`);
    if (card.features) textParts.push(`Features: ${card.features}`);
    if (card.eligibility) textParts.push(`Eligibility: ${card.eligibility}`);
    if (card.description) textParts.push(`Description: ${card.description}`);
    
    return textParts.join(' | ');
  }

  /**
   * Split text into chunks for better vectorization
   */
  chunkText(text, maxChunkSize) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || vectorA.length !== vectorB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get vector database statistics
   */
  getStats() {
    return {
      apiVectorCount: this.apiVectorDB.size,
      mitcVectorCount: this.mitcVectorDB.size,
      totalVectors: this.apiVectorDB.size + this.mitcVectorDB.size,
      isInitialized: this.isInitialized,
      lastUpdated: Date.now()
    };
  }

  /**
   * Clear vector databases
   */
  clear() {
    this.apiVectorDB.clear();
    this.mitcVectorDB.clear();
    this.metadata.clear();
    console.log('🗑️  Vector databases cleared');
  }

  /**
   * Refresh API vector database with new data
   */
  async refreshAPIData(cards) {
    console.log('🔄 Refreshing API vector database...');
    this.clear();
    await this.addAPIData(cards);
    console.log('✅ API vector database refreshed');
  }
}

module.exports = new VectorStore(); 