
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

  async searchCards(query: string = '', tags: string[] = [], bank: string = '', page: number = 1): Promise<CreditCard[]> {
    try {
      // Build the request payload according to BankKaro API format
      const requestData: any = {
        slug: query || "",
        page: page,
        limit: 20
      };

      // Add tag filter if provided
      if (tags.length > 0) {
        requestData.tag_slug = tags[0]; // API seems to handle one tag at a time
      }

      // Add bank filter if provided
      if (bank) {
        requestData.bank = bank;
      }

      console.log('Making API request to /cards with:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      console.log('API Response:', response);
      
      if (response && response.data && response.data.cards) {
        return this.transformCards(response.data.cards);
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      throw error;
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      const response = await this.makeRequest('/cards', { 
        slug: slug,
        page: 1,
        limit: 1 
      });
      
      if (response && response.data && response.data.cards && response.data.cards.length > 0) {
        return this.transformCard(response.data.cards[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error in getCardDetails:', error);
      throw error;
    }
  }

  async getBanksAndTags(): Promise<{ banks: any[], tags: any[] }> {
    try {
      const response = await this.makeRequest('/bank-tags', {});
      console.log('Bank-tags response:', response);
      
      return {
        banks: response.data?.banks || [],
        tags: response.data?.tags || []
      };
    } catch (error) {
      console.error('Error in getBanksAndTags:', error);
      return { banks: [], tags: [] };
    }
  }

  private transformCard(apiCard: any): CreditCard {
    return {
      id: apiCard.id || apiCard.slug,
      name: apiCard.name || 'Unknown Card',
      slug: apiCard.slug || this.generateSlug(apiCard.name || ''),
      image: apiCard.image,
      bank_name: apiCard.bank_name || 'Unknown Bank',
      joining_fee: apiCard.joining_fee || 0,
      annual_fee: apiCard.annual_fee || 0,
      welcome_offer: apiCard.welcome_offer,
      apply_url: apiCard.apply_url,
      tags: this.extractTags(apiCard),
      features: Array.isArray(apiCard.features) ? apiCard.features : [],
      other_info: Array.isArray(apiCard.other_info) ? apiCard.other_info : [],
      cashback_rate: apiCard.cashback_rate,
      reward_rate: apiCard.reward_rate,
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: Array.isArray(apiCard.eligibility) ? apiCard.eligibility : []
    };
  }

  private transformCards(apiCards: any[]): CreditCard[] {
    if (!Array.isArray(apiCards)) {
      return [];
    }
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
    
    // Extract from features and other_info using fuzzy matching
    const features = Array.isArray(card.features) ? card.features.join(' ').toLowerCase() : '';
    const otherInfo = Array.isArray(card.other_info) ? 
      card.other_info.map((info: any) => typeof info === 'string' ? info : info.content || '').join(' ').toLowerCase() : '';
    const allText = `${features} ${otherInfo}`;
    
    if (allText.includes('fuel')) tags.push('fuel');
    if (allText.includes('cashback')) tags.push('cashback');
    if (allText.includes('lounge') || allText.includes('airport')) tags.push('airport-lounge');
    if (allText.includes('shopping') || allText.includes('retail')) tags.push('shopping');
    if (allText.includes('travel')) tags.push('travel');
    if (allText.includes('reward')) tags.push('rewards');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private hasLoungeAccess(card: any): boolean {
    const features = Array.isArray(card.features) ? card.features.join(' ').toLowerCase() : '';
    const otherInfo = Array.isArray(card.other_info) ? 
      card.other_info.map((info: any) => typeof info === 'string' ? info : info.content || '').join(' ').toLowerCase() : '';
    const allText = `${features} ${otherInfo}`;
    
    return allText.includes('lounge') || allText.includes('airport lounge');
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export const cardService = new CardService();
