const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const { RAG_CONFIG } = require('../../config/rag_config');

class PDFProcessor {
  constructor() {
    this.mitcPath = RAG_CONFIG.MITC_DOCUMENTS_PATH;
    this.processedDocuments = new Map();
  }

  /**
   * Process all MITC documents in the directory
   */
  async processAllMITCDocuments() {
    try {
      console.log('📄 Processing MITC documents...');
      
      if (!await fs.pathExists(this.mitcPath)) {
        console.log('📁 MITC documents directory not found, creating...');
        await fs.ensureDir(this.mitcPath);
        return [];
      }

      const cardDirectories = await fs.readdir(this.mitcPath);
      const processedDocs = [];

      for (const cardDir of cardDirectories) {
        const cardPath = path.join(this.mitcPath, cardDir);
        const stats = await fs.stat(cardPath);
        
        if (stats.isDirectory()) {
          const cardDocs = await this.processCardDocuments(cardDir, cardPath);
          processedDocs.push(...cardDocs);
        }
      }

      console.log(`✅ Processed ${processedDocs.length} MITC documents`);
      return processedDocs;
    } catch (error) {
      console.error('❌ Error processing MITC documents:', error);
      return [];
    }
  }

  /**
   * Process documents for a specific card
   */
  async processCardDocuments(cardName, cardPath) {
    try {
      const files = await fs.readdir(cardPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      const processedDocs = [];

      for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(cardPath, pdfFile);
        const documentText = await this.extractTextFromPDF(pdfPath);
        
        if (documentText) {
          processedDocs.push({
            cardName,
            fileName: pdfFile,
            filePath: pdfPath,
            text: documentText,
            processedAt: Date.now()
          });
        }
      }

      return processedDocs;
    } catch (error) {
      console.error(`❌ Error processing documents for ${cardName}:`, error);
      return [];
    }
  }

  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      if (data && data.text) {
        return this.cleanText(data.text);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error extracting text from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\t+/g, ' ') // Replace tabs with space
      .trim()
      .replace(/\s+/g, ' '); // Final cleanup of multiple spaces
  }

  /**
   * Get processed document by card name
   */
  getProcessedDocument(cardName) {
    return this.processedDocuments.get(cardName);
  }

  /**
   * Add a document to the processed documents cache
   */
  addProcessedDocument(cardName, document) {
    this.processedDocuments.set(cardName, document);
  }

  /**
   * Get all processed documents
   */
  getAllProcessedDocuments() {
    return Array.from(this.processedDocuments.values());
  }

  /**
   * Check if a card has MITC documents
   */
  async hasMITCDocuments(cardName) {
    try {
      const cardPath = path.join(this.mitcPath, cardName);
      if (!await fs.pathExists(cardPath)) {
        return false;
      }

      const files = await fs.readdir(cardPath);
      return files.some(file => file.toLowerCase().endsWith('.pdf'));
    } catch (error) {
      console.error(`❌ Error checking MITC documents for ${cardName}:`, error);
      return false;
    }
  }

  /**
   * Get MITC document statistics
   */
  async getDocumentStats() {
    try {
      if (!await fs.pathExists(this.mitcPath)) {
        return { totalCards: 0, totalDocuments: 0, cards: [] };
      }

      const cardDirectories = await fs.readdir(this.mitcPath);
      const stats = {
        totalCards: 0,
        totalDocuments: 0,
        cards: []
      };

      for (const cardDir of cardDirectories) {
        const cardPath = path.join(this.mitcPath, cardDir);
        const cardStats = await fs.stat(cardPath);
        
        if (cardStats.isDirectory()) {
          const files = await fs.readdir(cardPath);
          const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
          
          stats.totalCards++;
          stats.totalDocuments += pdfFiles.length;
          stats.cards.push({
            name: cardDir,
            documentCount: pdfFiles.length,
            documents: pdfFiles
          });
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting document stats:', error);
      return { totalCards: 0, totalDocuments: 0, cards: [] };
    }
  }

  /**
   * Create sample MITC document structure
   */
  async createSampleStructure() {
    try {
      const sampleCards = [
        'HDFC Regalia',
        'ICICI Amazon Pay',
        'SBI SimplyCLICK',
        'Axis Flipkart'
      ];

      for (const cardName of sampleCards) {
        const cardPath = path.join(this.mitcPath, cardName);
        await fs.ensureDir(cardPath);
        
        // Create a sample PDF placeholder
        const sampleText = `MITC Document for ${cardName}
        
        This is a sample MITC (Most Important Terms and Conditions) document for ${cardName}.
        
        Key Terms:
        - Annual Fee: As per bank's discretion
        - Interest Rate: As per bank's policy
        - Credit Limit: Based on credit assessment
        - Rewards: Subject to terms and conditions
        
        Please refer to the actual bank document for complete terms and conditions.`;
        
        const samplePath = path.join(cardPath, 'mitc_terms.pdf');
        await fs.writeFile(samplePath, sampleText);
      }

      console.log('✅ Created sample MITC document structure');
    } catch (error) {
      console.error('❌ Error creating sample structure:', error);
    }
  }

  /**
   * Clear processed documents cache
   */
  clearCache() {
    this.processedDocuments.clear();
    console.log('🗑️  PDF processor cache cleared');
  }
}

module.exports = new PDFProcessor(); 