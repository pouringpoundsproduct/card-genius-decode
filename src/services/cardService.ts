import { CreditCard, ApiResponse } from '../types/card';

const API_BASE_URL = 'https://bk-api.bankkaro.com/sp/api';

// Fallback data for when API fails
const fallbackBanks = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'sbi', name: 'SBI' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'indusind', name: 'IndusInd Bank' },
  { id: 'yes', name: 'YES Bank' },
  { id: 'rbl', name: 'RBL Bank' }
];

const fallbackTags = [
  { id: 'ltf', name: 'Lifetime Free' },
  { id: 'cashback', name: 'Cashback' },
  { id: 'airport-lounge', name: 'Airport Lounge' },
  { id: 'fuel', name: 'Fuel Benefits' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'travel', name: 'Travel' },
  { id: 'rewards', name: 'Reward Points' }
];

// Known working card slugs for initial featured cards
const featuredCardSlugs = [
  'hdfc-regalia-credit-card',
  'sbi-simplysave-credit-card',
  'icici-amazon-pay-credit-card',
  'axis-magnus-credit-card',
  'hdfc-millennia-credit-card',
  'sbi-cashback-credit-card'
];

class CardService {
  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    try {
      console.log(`Making request to ${API_BASE_URL}${endpoint}`, data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data || {}),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getFeaturedCards(): Promise<CreditCard[]> {
    const cards: CreditCard[] = [];
    
    for (const slug of featuredCardSlugs) {
      try {
        const card = await this.getCardDetails(slug);
        if (card) {
          cards.push(card);
        }
      } catch (error) {
        console.warn(`Failed to load featured card: ${slug}`, error);
        // Continue with other cards even if one fails
      }
    }
    
    return cards;
  }

  async searchCards(query: string = '', tags: string[] = [], bank: string = '', page: number = 1): Promise<CreditCard[]> {
    try {
      // Don't make API call with empty parameters - return featured cards instead
      if (!query && tags.length === 0 && !bank) {
        return this.getFeaturedCards();
      }

      const requestData: any = {
        page: page,
        limit: 20
      };

      // Only add parameters if they have values
      if (query) {
        // Convert search query to potential slug format
        const slugQuery = query.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        requestData.slug = slugQuery;
      }

      if (tags.length > 0) {
        requestData.tag_slug = tags[0];
      }

      if (bank) {
        requestData.bank = bank;
      }

      console.log('Search request:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.data && response.data.cards) {
        return this.transformCards(response.data.cards);
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      // Return featured cards as fallback
      if (!query && tags.length === 0 && !bank) {
        return this.getFeaturedCards();
      }
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
        banks: response.data?.banks || fallbackBanks,
        tags: response.data?.tags || fallbackTags
      };
    } catch (error) {
      console.error('Error in getBanksAndTags, using fallback data:', error);
      // Return fallback data when API fails
      return { 
        banks: fallbackBanks, 
        tags: fallbackTags 
      };
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
