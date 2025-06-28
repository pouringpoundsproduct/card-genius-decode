const { RAG_CONFIG } = require('../../config/rag_config');

class ScoringSystem {
  constructor() {
    this.confidenceThreshold = RAG_CONFIG.CONFIDENCE_THRESHOLD;
    this.learningRate = RAG_CONFIG.LEARNING_RATE;
    this.feedbackHistory = [];
    this.scoreWeights = {
      api: RAG_CONFIG.API_SCORE_WEIGHT,
      mitc: RAG_CONFIG.MITC_SCORE_WEIGHT,
      openai: RAG_CONFIG.OPENAI_SCORE_WEIGHT
    };
  }

  /**
   * Calculate relevance score for a response
   */
  calculateRelevanceScore(query, response, source) {
    try {
      const queryWords = this.tokenize(query.toLowerCase());
      const responseWords = this.tokenize(response.toLowerCase());
      
      // Calculate word overlap
      const commonWords = queryWords.filter(word => responseWords.includes(word));
      const overlapRatio = commonWords.length / Math.max(queryWords.length, 1);
      
      // Calculate semantic similarity (simplified)
      const semanticScore = this.calculateSemanticSimilarity(query, response);
      
      // Weighted combination
      const relevanceScore = (overlapRatio * 0.6) + (semanticScore * 0.4);
      
      return Math.min(relevanceScore, 1.0);
    } catch (error) {
      console.error('❌ Error calculating relevance score:', error);
      return 0.5; // Default score
    }
  }

  /**
   * Calculate completeness score for a response
   */
  calculateCompletenessScore(query, response, source) {
    try {
      const queryIntent = this.analyzeQueryIntent(query);
      const responseCoverage = this.analyzeResponseCoverage(response, queryIntent);
      
      // Base completeness score
      let completenessScore = responseCoverage;
      
      // Adjust based on source type
      switch (source) {
        case 'api':
          completenessScore *= 0.9; // API responses are more structured
          break;
        case 'mitc':
          completenessScore *= 0.8; // MITC documents are detailed but may be verbose
          break;
        case 'openai':
          completenessScore *= 0.95; // OpenAI responses are comprehensive
          break;
      }
      
      return Math.min(completenessScore, 1.0);
    } catch (error) {
      console.error('❌ Error calculating completeness score:', error);
      return 0.5; // Default score
    }
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(query, response, source, similarityScore = 0.5) {
    try {
      const relevanceScore = this.calculateRelevanceScore(query, response, source);
      const completenessScore = this.calculateCompletenessScore(query, response, source);
      
      // Weighted combination
      const confidenceScore = (
        relevanceScore * 0.4 +
        completenessScore * 0.3 +
        similarityScore * 0.3
      );
      
      return Math.min(confidenceScore, 1.0);
    } catch (error) {
      console.error('❌ Error calculating confidence score:', error);
      return 0.5; // Default score
    }
  }

  /**
   * Analyze query intent
   */
  analyzeQueryIntent(query) {
    const intents = {
      recommendation: ['best', 'recommend', 'suggest', 'top', 'good'],
      comparison: ['compare', 'difference', 'vs', 'versus', 'better'],
      information: ['what', 'how', 'when', 'where', 'why', 'tell me'],
      specific: ['annual fee', 'interest rate', 'rewards', 'benefits', 'eligibility']
    };
    
    const queryLower = query.toLowerCase();
    const detectedIntents = [];
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        detectedIntents.push(intent);
      }
    }
    
    return detectedIntents.length > 0 ? detectedIntents : ['general'];
  }

  /**
   * Analyze response coverage
   */
  analyzeResponseCoverage(response, queryIntents) {
    let coverageScore = 0.5; // Base score
    
    // Check if response addresses the detected intents
    for (const intent of queryIntents) {
      switch (intent) {
        case 'recommendation':
          if (response.toLowerCase().includes('recommend') || 
              response.toLowerCase().includes('best') ||
              response.toLowerCase().includes('suggest')) {
            coverageScore += 0.2;
          }
          break;
        case 'comparison':
          if (response.toLowerCase().includes('compare') || 
              response.toLowerCase().includes('difference') ||
              response.toLowerCase().includes('vs')) {
            coverageScore += 0.2;
          }
          break;
        case 'specific':
          if (response.toLowerCase().includes('annual fee') || 
              response.toLowerCase().includes('interest rate') ||
              response.toLowerCase().includes('rewards')) {
            coverageScore += 0.2;
          }
          break;
      }
    }
    
    return Math.min(coverageScore, 1.0);
  }

  /**
   * Calculate semantic similarity (simplified)
   */
  calculateSemanticSimilarity(text1, text2) {
    try {
      const words1 = this.tokenize(text1);
      const words2 = this.tokenize(text2);
      
      const commonWords = words1.filter(word => words2.includes(word));
      const totalWords = new Set([...words1, ...words2]);
      
      return commonWords.length / totalWords.size;
    } catch (error) {
      return 0.5; // Default similarity
    }
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
   * Record user feedback for learning
   */
  recordFeedback(query, response, source, userRating, feedback = '') {
    try {
      const feedbackEntry = {
        query,
        response,
        source,
        userRating: parseFloat(userRating),
        feedback,
        timestamp: Date.now(),
        calculatedScore: this.calculateConfidenceScore(query, response, source)
      };
      
      this.feedbackHistory.push(feedbackEntry);
      
      // Keep only recent feedback (last 100 entries)
      if (this.feedbackHistory.length > 100) {
        this.feedbackHistory = this.feedbackHistory.slice(-100);
      }
      
      // Update scoring weights based on feedback
      this.updateScoringWeights();
      
      console.log(`📊 Feedback recorded: ${userRating}/5 for ${source} response`);
    } catch (error) {
      console.error('❌ Error recording feedback:', error);
    }
  }

  /**
   * Update scoring weights based on feedback history
   */
  updateScoringWeights() {
    if (this.feedbackHistory.length < 10) return; // Need minimum feedback
    
    try {
      const sourceScores = { api: [], mitc: [], openai: [] };
      
      // Calculate average user ratings per source
      for (const entry of this.feedbackHistory) {
        if (sourceScores[entry.source]) {
          sourceScores[entry.source].push(entry.userRating);
        }
      }
      
      const avgScores = {};
      for (const [source, scores] of Object.entries(sourceScores)) {
        if (scores.length > 0) {
          avgScores[source] = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      }
      
      // Adjust weights based on performance
      const totalScore = Object.values(avgScores).reduce((a, b) => a + b, 0);
      if (totalScore > 0) {
        for (const [source, avgScore] of Object.entries(avgScores)) {
          const newWeight = (avgScore / totalScore) * this.learningRate;
          this.scoreWeights[source] = Math.max(0.1, Math.min(0.8, newWeight));
        }
      }
      
      console.log('🔄 Updated scoring weights:', this.scoreWeights);
    } catch (error) {
      console.error('❌ Error updating scoring weights:', error);
    }
  }

  /**
   * Get scoring system statistics
   */
  getStats() {
    return {
      confidenceThreshold: this.confidenceThreshold,
      scoreWeights: this.scoreWeights,
      feedbackCount: this.feedbackHistory.length,
      averageUserRating: this.feedbackHistory.length > 0 
        ? this.feedbackHistory.reduce((sum, entry) => sum + entry.userRating, 0) / this.feedbackHistory.length
        : 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
    console.log(`🎯 Confidence threshold updated to: ${this.confidenceThreshold}`);
  }

  /**
   * Reset scoring system
   */
  reset() {
    this.feedbackHistory = [];
    this.scoreWeights = {
      api: RAG_CONFIG.API_SCORE_WEIGHT,
      mitc: RAG_CONFIG.MITC_SCORE_WEIGHT,
      openai: RAG_CONFIG.OPENAI_SCORE_WEIGHT
    };
    console.log('🔄 Scoring system reset to defaults');
  }
}

module.exports = new ScoringSystem(); 