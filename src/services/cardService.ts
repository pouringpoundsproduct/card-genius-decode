
import { CreditCard, ApiResponse } from '../types/card';

const API_BASE_URL = 'https://bk-api.bankkaro.com/sp/api';

class CardService {
  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async searchCards(query: string = '', tags: string[] = []): Promise<CreditCard[]> {
    try {
      const requestData = {
        query,
        tags,
        limit: 20,
        offset: 0
      };

      console.log('Making API request to /cards with:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.cards) {
        return this.transformCards(response.cards);
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      throw error;
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      const response = await this.makeRequest('/cards', { slug });
      
      if (response && response.cards && response.cards.length > 0) {
        return this.transformCard(response.cards[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error in getCardDetails:', error);
      throw error;
    }
  }

  async getBanksAndTags(): Promise<{ banks: any[], tags: any[] }> {
    try {
      const response = await this.makeRequest('/bank-tags');
      return {
        banks: response.banks || [],
        tags: response.tags || []
      };
    } catch (error) {
      console.error('Error in getBanksAndTags:', error);
      throw error;
    }
  }

  private transformCard(apiCard: any): CreditCard {
    return {
      id: apiCard.id,
      name: apiCard.name || 'Unknown Card',
      slug: apiCard.slug || this.generateSlug(apiCard.name),
      image: apiCard.image,
      bank_name: apiCard.bank_name || 'Unknown Bank',
      joining_fee: apiCard.joining_fee || 0,
      annual_fee: apiCard.annual_fee || 0,
      welcome_offer: apiCard.welcome_offer,
      apply_url: apiCard.apply_url,
      tags: this.extractTags(apiCard),
      features: apiCard.features || [],
      other_info: apiCard.other_info || []
    };
  }

  private transformCards(apiCards: any[]): CreditCard[] {
    return apiCards.map(card => this.transformCard(card));
  }

  private extractTags(card: any): string[] {
    const tags: string[] = [];
    
    // Auto-detect LTF (Lifetime Free)
    if (card.joining_fee === 0 || card.joining_fee === '0') {
      tags.push('ltf');
    }
    
    // Extract from tags array if available
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags);
    }
    
    // Extract from features using fuzzy matching
    const features = (card.features || []).join(' ').toLowerCase();
    const otherInfo = (card.other_info || []).join(' ').toLowerCase();
    const allText = `${features} ${otherInfo}`;
    
    if (allText.includes('fuel')) tags.push('fuel');
    if (allText.includes('cashback')) tags.push('cashback');
    if (allText.includes('lounge') || allText.includes('airport')) tags.push('airport-lounge');
    if (allText.includes('shopping') || allText.includes('retail')) tags.push('shopping');
    if (allText.includes('travel')) tags.push('travel');
    if (allText.includes('reward')) tags.push('rewards');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export const cardService = new CardService();
