import { CreditCard, ApiResponse } from '../types/card';
import Fuse from 'fuse.js';

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
  { id: '1', name: 'Fuel', slug: 'best-fuel-credit-card' },
  { id: '2', name: 'Shopping', slug: 'best-shopping-credit-card' },
  { id: '4', name: 'Airport Lounge', slug: 'A-b-c-d' },
  { id: '5', name: 'Online Food Ordering', slug: 'online-food-ordering' },
  { id: '6', name: 'Dining', slug: 'best-dining-credit-card' },
  { id: '7', name: 'Grocery Shopping', slug: 'BestCardsforGroceryShopping' },
  { id: '12', name: 'Travel', slug: 'best-travel-credit-card' },
  { id: '14', name: 'Utility Bills', slug: 'best-utility-credit-card' }
];

class CardService {
  private allCards: CreditCard[] = [];
  private fuse: Fuse<CreditCard> | null = null;

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

  async getAllCards(): Promise<CreditCard[]> {
    try {
      const requestData = {
        slug: "",
        banks_ids: [],
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "",
        free_cards: "",
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      console.log('Fetching all cards with payload:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.data && response.data.cards) {
        this.allCards = this.transformCards(response.data.cards);
        this.initializeFuse();
        console.log('Transformed cards:', this.allCards);
        return this.allCards;
      }
      
      return [];
    } catch (error) {
      console.error('Error in getAllCards:', error);
      return [];
    }
  }

  async getFeaturedCards(): Promise<CreditCard[]> {
    try {
      // Get all cards first
      const allCards = await this.getAllCards();
      
      // Return a subset of featured cards (e.g., first 10 cards)
      return allCards.slice(0, 10);
    } catch (error) {
      console.error('Error in getFeaturedCards:', error);
      return [];
    }
  }

  async searchCards(
    query: string = '', 
    tags: string[] = [], 
    bankIds: string[] = [], 
    freeCards: boolean = false
  ): Promise<CreditCard[]> {
    try {
      // If no search criteria, return all cards
      if (!query && tags.length === 0 && bankIds.length === 0 && !freeCards) {
        return this.getAllCards();
      }

      const requestData = {
        slug: query ? this.generateSlug(query) : "",
        banks_ids: bankIds,
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "",
        free_cards: freeCards ? "1" : "",
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      console.log('Search request:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.data && response.data.cards) {
        let cards = this.transformCards(response.data.cards);
        
        // Client-side filtering for tags if API doesn't handle it properly
        if (tags.length > 0) {
          cards = cards.filter(card => 
            card.tags?.some(tag => tags.includes(tag)) ||
            this.cardMatchesTags(card, tags)
          );
        }
        
        return cards;
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      // Return all cards as fallback
      if (!query && tags.length === 0 && bankIds.length === 0) {
        return this.getAllCards();
      }
      return [];
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      const requestData = {
        slug: slug,
        banks_ids: [],
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "",
        free_cards: "",
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.data && response.data.cards && response.data.cards.length > 0) {
        return this.transformCard(response.data.cards[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error in getCardDetails:', error);
      return null;
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
      return { 
        banks: fallbackBanks, 
        tags: fallbackTags 
      };
    }
  }

  private cardMatchesTags(card: CreditCard, tags: string[]): boolean {
    const cardText = `${card.name} ${card.features?.join(' ')} ${card.other_info?.join(' ')}`.toLowerCase();
    
    return tags.some(tag => {
      switch(tag) {
        case 'fuel':
        case 'best-fuel-credit-card':
          return cardText.includes('fuel') || cardText.includes('petrol');
        case 'shopping':
        case 'best-shopping-credit-card':
          return cardText.includes('shopping') || cardText.includes('retail');
        case 'airport-lounge':
        case 'A-b-c-d':
          return cardText.includes('lounge') || cardText.includes('airport');
        case 'travel':
        case 'best-travel-credit-card':
          return cardText.includes('travel') || cardText.includes('miles');
        case 'dining':
        case 'best-dining-credit-card':
          return cardText.includes('dining') || cardText.includes('restaurant');
        case 'grocery':
        case 'BestCardsforGroceryShopping':
          return cardText.includes('grocery') || cardText.includes('supermarket');
        default:
          return false;
      }
    });
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

  private initializeFuse() {
    if (this.allCards.length > 0) {
      const options = {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'bank_name', weight: 0.5 },
          { name: 'features', weight: 0.3 },
          { name: 'tags', weight: 0.4 }
        ],
        threshold: 0.3,
        includeScore: true
      };
      
      this.fuse = new Fuse(this.allCards, options);
    }
  }
}

export const cardService = new CardService();
