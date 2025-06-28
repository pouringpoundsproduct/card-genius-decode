const { pipeline } = require('@xenova/transformers');
const { RAG_CONFIG } = require('../../config/rag_config');

class EmbeddingService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    try {
      console.log('🔄 Initializing embedding model...');
      
      // Use a lightweight sentence transformer model
      this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.isInitialized = true;
      
      console.log('✅ Embedding model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize embedding model:', error);
      // Fallback to simple TF-IDF based approach
      console.log('🔄 Falling back to TF-IDF based embeddings...');
      this.isInitialized = true;
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.model) {
        // Use transformer model
        return await this.generateTransformerEmbeddings(text);
      } else {
        // Fallback to TF-IDF based approach
        return this.generateTFIDFEmbeddings(text);
      }
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      // Return a simple hash-based embedding as last resort
      return this.generateHashEmbeddings(text);
    }
  }

  /**
   * Generate embeddings using transformer model
   */
  async generateTransformerEmbeddings(text) {
    try {
      const output = await this.model(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('❌ Transformer embedding failed, falling back to TF-IDF:', error);
      return this.generateTFIDFEmbeddings(text);
    }
  }

  /**
   * Generate TF-IDF based embeddings
   */
  generateTFIDFEmbeddings(text) {
    const words = this.tokenize(text);
    const wordFreq = this.calculateWordFrequency(words);
    const vector = this.createTFIDFVector(wordFreq, words.length);
    
    // Normalize vector to unit length
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Generate hash-based embeddings as fallback
   */
  generateHashEmbeddings(text) {
    const vector = new Array(RAG_CONFIG.VECTOR_DB_DIMENSION).fill(0);
    const words = this.tokenize(text);
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      const index = hash % RAG_CONFIG.VECTOR_DB_DIMENSION;
      vector[index] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Calculate word frequency
   */
  calculateWordFrequency(words) {
    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
  }

  /**
   * Create TF-IDF vector
   */
  createTFIDFVector(wordFreq, totalWords) {
    const vector = new Array(RAG_CONFIG.VECTOR_DB_DIMENSION).fill(0);
    const words = Object.keys(wordFreq);
    
    for (let i = 0; i < Math.min(words.length, RAG_CONFIG.VECTOR_DB_DIMENSION); i++) {
      const word = words[i];
      const tf = wordFreq[word] / totalWords;
      const idf = this.calculateIDF(word);
      vector[i] = tf * idf;
    }
    
    return vector;
  }

  /**
   * Calculate IDF for a word (simplified)
   */
  calculateIDF(word) {
    // Simplified IDF calculation
    // In a real implementation, this would be based on a corpus
    return Math.log(1000 / (1 + Math.random() * 100));
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get embedding service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      modelType: this.model ? 'transformer' : 'tfidf',
      dimension: RAG_CONFIG.VECTOR_DB_DIMENSION
    };
  }
}

// Create singleton instance
const embeddingService = new EmbeddingService();

// Export the generateEmbeddings function
const generateEmbeddings = async (text) => {
  return await embeddingService.generateEmbeddings(text);
};

module.exports = {
  generateEmbeddings,
  embeddingService
}; 