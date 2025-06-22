
import { CreditCard, ApiResponse } from '../types/card';
import Fuse from 'fuse.js';

const API_BASE_URL = 'https://bk-api.bankkaro.com/sp/api';

class CardService {
  private allCards: CreditCard[] = [];
  private banks: any[] = [];
  private tags: any[] = [];
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

  async getBanksAndTags(): Promise<{ banks: any[], tags: any[] }> {
    try {
      console.log('Fetching banks and tags from API...');
      const response = await this.makeRequest('/bank-tags', {});
      
      if (response && response.data) {
        this.banks = response.data.banks || [];
        this.tags = response.data.tags || [];
        
        console.log('Banks loaded:', this.banks);
        console.log('Tags loaded:', this.tags);
        
        return {
          banks: this.banks,
          tags: this.tags
        };
      }
      
      // Fallback data
      this.banks = [
        { id: '14', name: 'ICICI Bank' },
        { id: '1', name: 'HDFC Bank' },
        { id: '2', name: 'SBI' },
        { id: '3', name: 'Axis Bank' },
        { id: '4', name: 'Kotak Mahindra Bank' }
      ];
      
      this.tags = [
        { id: '1', name: 'Fuel', slug: 'best-fuel-credit-card' },
        { id: '2', name: 'Shopping', slug: 'best-shopping-credit-card' },
        { id: '4', name: 'Airport Lounge', slug: 'A-b-c-d' },
        { id: '12', name: 'Travel', slug: 'best-travel-credit-card' }
      ];
      
      return { banks: this.banks, tags: this.tags };
    } catch (error) {
      console.error('Error in getBanksAndTags:', error);
      return { 
        banks: this.banks.length > 0 ? this.banks : [], 
        tags: this.tags.length > 0 ? this.tags : [] 
      };
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
        console.log('Transformed cards:', this.allCards.length, 'cards loaded');
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
      const allCards = await this.getAllCards();
      return allCards.slice(0, 8);
    } catch (error) {
      console.error('Error in getFeaturedCards:', error);
      return [];
    }
  }

  async searchCards(
    query: string = '', 
    tagSlugs: string[] = [], 
    bankIds: string[] = [], 
    freeCards: boolean = false
  ): Promise<CreditCard[]> {
    try {
      console.log('Search parameters:', { query, tagSlugs, bankIds, freeCards });

      // Build the API request payload
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

      console.log('Search request payload:', requestData);
      const response = await this.makeRequest('/cards', requestData);
      
      if (response && response.data && response.data.cards) {
        let cards = this.transformCards(response.data.cards);
        
        // Client-side tag filtering if needed
        if (tagSlugs.length > 0) {
          cards = this.filterByTags(cards, tagSlugs);
        }
        
        console.log('Search results:', cards.length, 'cards found');
        return cards;
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      return [];
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      console.log('Fetching card details for slug:', slug);
      
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
      
      if (response && response.data) {
        // Handle both single card and cards array response
        if (response.data.card_details) {
          return this.transformDetailCard(response.data.card_details);
        } else if (response.data.cards && response.data.cards.length > 0) {
          return this.transformCard(response.data.cards[0]);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in getCardDetails:', error);
      return null;
    }
  }

  private filterByTags(cards: CreditCard[], tagSlugs: string[]): CreditCard[] {
    return cards.filter(card => {
      return tagSlugs.some(slug => {
        // Check if card has matching tag
        if (card.tags?.some(tag => this.normalizeTag(tag) === slug)) {
          return true;
        }
        
        // Fallback: check card content for tag keywords
        return this.cardMatchesTagSlug(card, slug);
      });
    });
  }

  private cardMatchesTagSlug(card: CreditCard, slug: string): boolean {
    const cardText = `${card.name} ${card.features?.join(' ')} ${card.other_info?.join(' ')}`.toLowerCase();
    
    switch(slug) {
      case 'best-fuel-credit-card':
        return cardText.includes('fuel') || cardText.includes('petrol');
      case 'best-shopping-credit-card':
        return cardText.includes('shopping') || cardText.includes('retail');
      case 'A-b-c-d':
        return cardText.includes('lounge') || cardText.includes('airport');
      case 'best-travel-credit-card':
        return cardText.includes('travel') || cardText.includes('miles');
      case 'best-dining-credit-card':
        return cardText.includes('dining') || cardText.includes('restaurant');
      default:
        return false;
    }
  }

  private transformDetailCard(apiCard: any): CreditCard {
    console.log('Transforming detailed card:', apiCard);
    
    return {
      id: apiCard.id?.toString() || apiCard.seo_card_alias,
      name: apiCard.name || 'Unknown Card',
      slug: apiCard.seo_card_alias || apiCard.card_alias || this.generateSlug(apiCard.name || ''),
      image: apiCard.image,
      bank_name: apiCard.banks?.name || 'Unknown Bank',
      joining_fee: apiCard.joining_fee_text || 0,
      annual_fee: apiCard.annual_fee_text || 0,
      welcome_offer: this.extractWelcomeOffer(apiCard),
      apply_url: apiCard.network_url,
      tags: this.extractDetailTags(apiCard),
      features: this.extractFeatures(apiCard),
      other_info: this.extractOtherInfo(apiCard),
      cashback_rate: apiCard.reward_conversion_rate,
      reward_rate: apiCard.reward_conversion_rate,
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: this.extractEligibility(apiCard)
    };
  }

  private transformCard(apiCard: any): CreditCard {
    return {
      id: apiCard.id?.toString() || apiCard.slug,
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

  private extractWelcomeOffer(card: any): string {
    if (card.product_usps && Array.isArray(card.product_usps) && card.product_usps.length > 0) {
      return card.product_usps[0].header + ' ' + card.product_usps[0].description;
    }
    return '';
  }

  private extractDetailTags(card: any): string[] {
    const tags: string[] = [];
    
    // Auto-detect LTF (Lifetime Free)
    if (card.joining_fee_text === '0' || card.annual_fee_text === '0') {
      tags.push('ltf');
    }
    
    // Extract from tags array if available
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags.map((tag: any) => tag.slug || tag.name?.toLowerCase().replace(/\s+/g, '-')));
    }
    
    return [...new Set(tags)];
  }

  private extractFeatures(card: any): string[] {
    const features: string[] = [];
    
    if (card.product_usps && Array.isArray(card.product_usps)) {
      features.push(...card.product_usps.map((usp: any) => usp.header + ': ' + usp.description));
    }
    
    if (card.product_benefits && Array.isArray(card.product_benefits)) {
      card.product_benefits.forEach((benefit: any) => {
        if (benefit.html_text) {
          // Extract text from HTML
          const text = benefit.html_text.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
          if (text) features.push(text);
        }
      });
    }
    
    return features;
  }

  private extractOtherInfo(card: any): string[] {
    const info: string[] = [];
    
    if (card.bank_fee_structure) {
      const fees = card.bank_fee_structure;
      if (fees.forex_markup) info.push(`Forex Markup: ${fees.forex_markup}`);
      if (fees.apr_fees) info.push(`APR: ${fees.apr_fees}`);
      if (fees.late_payment_fine) info.push(`Late Payment: ${fees.late_payment_fine}`);
    }
    
    if (card.redemption_options) {
      info.push(`Redemption: ${card.redemption_options.replace(/<[^>]*>/g, '')}`);
    }
    
    return info;
  }

  private extractEligibility(card: any): string[] {
    const eligibility: string[] = [];
    
    if (card.age_criteria) eligibility.push(`Age: ${card.age_criteria} years`);
    if (card.income) eligibility.push(`Income: ₹${card.income}+ per month`);
    if (card.crif) eligibility.push(`Credit Score: ${card.crif}+`);
    
    return eligibility;
  }

  private extractTags(card: any): string[] {
    const tags: string[] = [];
    
    // Auto-detect LTF (Lifetime Free)
    if (card.joining_fee === 0 || card.joining_fee === '0') {
      tags.push('ltf');
    }
    
    // Extract from tags array if available
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags.map((tag: any) => this.normalizeTag(tag)));
    }
    
    return [...new Set(tags)];
  }

  private normalizeTag(tag: any): string {
    if (typeof tag === 'string') return tag;
    if (tag && typeof tag === 'object') {
      return tag.slug || tag.name?.toLowerCase().replace(/\s+/g, '-') || tag.id || String(tag);
    }
    return String(tag);
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
