import { CreditCard, ApiResponse } from '../types/card';
import Fuse from 'fuse.js';

const API_BASE_URL = 'https://bk-api.bankkaro.com/sp/api';

interface BankTagsResponse {
  data: {
    banks: Array<{ id: string; name: string; logo?: string }>;
    tags: Array<{ id: string; name: string; slug: string; description?: string }>;
  };
}

interface CardsResponse {
  data: {
    cards: any[];
    card_details?: any;
  };
}

class CardService {
  private allCards: CreditCard[] = [];
  private banks: any[] = [];
  private tags: any[] = [];
  private fuse: Fuse<CreditCard> | null = null;
  private cache: Map<string, any> = new Map();
  private lastBankTagsUpdate = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    const cacheKey = `${endpoint}_${JSON.stringify(data)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for ${endpoint}`);
      return cached.data;
    }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getBanksAndTags(): Promise<{ banks: any[], tags: any[] }> {
    try {
      // Check if we have recent data
      if (this.banks.length > 0 && this.tags.length > 0 && 
          Date.now() - this.lastBankTagsUpdate < this.CACHE_DURATION) {
        return { banks: this.banks, tags: this.tags };
      }

      console.log('Fetching banks and tags from API...');
      const response: BankTagsResponse = await this.makeRequest('/bank-tags', {});
      
      if (response?.data) {
        this.banks = response.data.banks || [];
        this.tags = response.data.tags || [];
        this.lastBankTagsUpdate = Date.now();
        
        console.log('Banks loaded:', this.banks.length);
        console.log('Tags loaded:', this.tags.length);
        
        return { banks: this.banks, tags: this.tags };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error in getBanksAndTags:', error);
      
      // Return cached data if available, otherwise fallback
      if (this.banks.length > 0 || this.tags.length > 0) {
        return { banks: this.banks, tags: this.tags };
      }
      
      // Fallback data
      return this.getFallbackBanksAndTags();
    }
  }

  private getFallbackBanksAndTags() {
    const fallbackBanks = [
      { id: '1', name: 'HDFC Bank', logo: '' },
      { id: '2', name: 'SBI Card', logo: '' },
      { id: '3', name: 'Axis Bank', logo: '' },
      { id: '4', name: 'Kotak Mahindra Bank', logo: '' },
      { id: '14', name: 'ICICI Bank', logo: '' },
    ];
    
    const fallbackTags = [
      { id: '1', name: 'Fuel', slug: 'best-fuel-credit-card', description: 'Best for fuel purchases' },
      { id: '2', name: 'Shopping', slug: 'best-shopping-credit-card', description: 'Best for shopping rewards' },
      { id: '4', name: 'Airport Lounge', slug: 'A-b-c-d', description: 'Airport lounge access' },
      { id: '12', name: 'Travel', slug: 'best-travel-credit-card', description: 'Best for travel rewards' },
      { id: '13', name: 'Dining', slug: 'best-dining-credit-card', description: 'Best for dining rewards' },
    ];
    
    this.banks = fallbackBanks;
    this.tags = fallbackTags;
    
    return { banks: fallbackBanks, tags: fallbackTags };
  }

  private normalizeSearchQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async searchCards(
    query: string = '', 
    tagSlugs: string[] = [], 
    bankIds: string[] = [], 
    freeCards: boolean = false
  ): Promise<CreditCard[]> {
    try {
      console.log('Search parameters:', { query, tagSlugs, bankIds, freeCards });

      const normalizedQuery = this.normalizeSearchQuery(query);
      const searchSlug = normalizedQuery ? this.generateSlug(normalizedQuery) : '';

      const requestData = {
        slug: searchSlug,
        banks_ids: bankIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)),
        card_networks: [],
        annualFees: '',
        credit_score: '',
        sort_by: '',
        free_cards: freeCards ? '1' : '',
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      console.log('Search request payload:', requestData);
      const response: CardsResponse = await this.makeRequest('/cards', requestData);
      
      if (response?.data?.cards) {
        let cards = this.transformCards(response.data.cards);
        
        // Enhanced client-side search by name and nickname
        if (normalizedQuery && cards.length > 0) {
          cards = this.enhancedNameSearch(cards, normalizedQuery);
        }
        
        // Client-side filtering for tags if needed
        if (tagSlugs.length > 0) {
          cards = this.filterByTags(cards, tagSlugs);
        }
        
        // Calculate and sort by relevance scores
        cards = this.calculateRelevanceScores(cards, normalizedQuery, tagSlugs, bankIds, freeCards);
        
        console.log('Search results:', cards.length, 'cards found');
        return cards;
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      return [];
    }
  }

  private enhancedNameSearch(cards: CreditCard[], query: string): CreditCard[] {
    if (!query) return cards;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return cards.filter(card => {
      const cardName = (card.name || '').toLowerCase();
      const cardNickname = (card.nick_name || '').toLowerCase();
      const bankName = (card.bank_name || '').toLowerCase();
      
      // Check if all search terms are found in name, nickname, or bank name
      return searchTerms.every(term => 
        cardName.includes(term) || 
        cardNickname.includes(term) || 
        bankName.includes(term)
      );
    });
  }

  private calculateRelevanceScores(
    cards: CreditCard[], 
    query: string, 
    tagSlugs: string[], 
    bankIds: string[], 
    freeCards: boolean
  ): CreditCard[] {
    return cards.map(card => {
      let score = 0;
      
      // Name matching score
      if (query) {
        const cardName = (card.name || '').toLowerCase();
        const cardNickname = (card.nick_name || '').toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (cardName.includes(queryLower)) score += 10;
        if (cardNickname.includes(queryLower)) score += 8;
        if (cardName.startsWith(queryLower)) score += 5;
        if (cardNickname.startsWith(queryLower)) score += 3;
      }
      
      // Tag matching score
      if (tagSlugs.length > 0 && card.tags) {
        const matchingTags = tagSlugs.filter(slug => 
          card.tags?.some(tag => this.normalizeTag(tag) === slug)
        );
        score += matchingTags.length * 3;
      }
      
      // Bank matching score
      if (bankIds.length > 0) {
        const cardBankId = this.extractBankId(card);
        if (cardBankId && bankIds.includes(cardBankId)) {
          score += 5;
        }
      }
      
      // Free card preference
      if (freeCards) {
        const isLTF = this.normalizeFeess(card.joining_fee) === 0 || 
                     this.normalizeFeess(card.annual_fee) === 0;
        if (isLTF) score += 2;
      }
      
      return { ...card, relevanceScore: score };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private extractBankId(card: CreditCard): string | null {
    // Try to extract bank ID from card data
    if (card.bank_id) return card.bank_id.toString();
    
    // Fallback: match bank name to bank list
    const matchingBank = this.banks.find(bank => 
      bank.name.toLowerCase() === card.bank_name?.toLowerCase()
    );
    
    return matchingBank ? matchingBank.id : null;
  }

  async getAllCards(): Promise<CreditCard[]> {
    try {
      const requestData = {
        slug: '',
        banks_ids: [],
        card_networks: [],
        annualFees: '',
        credit_score: '',
        sort_by: '',
        free_cards: '',
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      const response: CardsResponse = await this.makeRequest('/cards', requestData);
      
      if (response?.data?.cards) {
        this.allCards = this.transformCards(response.data.cards);
        console.log('All cards loaded:', this.allCards.length);
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

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      console.log('Fetching card details for slug:', slug);
      
      const requestData = {
        slug: slug,
        banks_ids: [],
        card_networks: [],
        annualFees: '',
        credit_score: '',
        sort_by: '',
        free_cards: '',
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      const response: CardsResponse = await this.makeRequest('/cards', requestData);
      
      if (response?.data) {
        if (response.data.card_details) {
          return this.transformDetailCard(response.data.card_details);
        } else if (response.data.cards && response.data.cards.length > 0) {
          return this.transformDetailCard(response.data.cards[0]);
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
        if (card.tags?.some(tag => this.normalizeTag(tag) === slug)) {
          return true;
        }
        return this.cardMatchesTagSlug(card, slug);
      });
    });
  }

  private cardMatchesTagSlug(card: CreditCard, slug: string): boolean {
    const cardText = `${card.name} ${card.features?.join(' ')} ${card.other_info?.join(' ')}`.toLowerCase();
    
    const tagKeywords: { [key: string]: string[] } = {
      'best-fuel-credit-card': ['fuel', 'petrol', 'diesel', 'gas station', 'hpcl', 'bpcl', 'iocl'],
      'best-shopping-credit-card': ['shopping', 'retail', 'e-commerce', 'online shopping', 'cashback'],
      'A-b-c-d': ['lounge', 'airport', 'priority pass'],
      'best-travel-credit-card': ['travel', 'miles', 'airline', 'hotel', 'air miles'],
      'best-dining-credit-card': ['dining', 'restaurant', 'food', 'zomato', 'swiggy'],
      'BestCardsforGroceryShopping': ['grocery', 'supermarket', 'big bazaar', 'dmart'],
      'best-utility-credit-card': ['utility', 'bill payment', 'electricity', 'mobile recharge']
    };
    
    const keywords = tagKeywords[slug] || [];
    return keywords.some(keyword => cardText.includes(keyword));
  }

  private transformDetailCard(apiCard: any): CreditCard {
    console.log('Transforming detailed card:', apiCard);
    
    return {
      id: apiCard.id?.toString() || apiCard.seo_card_alias || 'unknown',
      name: apiCard.name || 'Unknown Card',
      nick_name: apiCard.nick_name || apiCard.name || 'Unknown Card',
      slug: apiCard.seo_card_alias || apiCard.card_alias || this.generateSlug(apiCard.name || ''),
      image: apiCard.image,
      bank_name: apiCard.banks?.name || apiCard.bank_name || 'Unknown Bank',
      bank_id: apiCard.bank_id,
      joining_fee: this.normalizeFeess(apiCard.joining_fee_text || apiCard.joining_fee),
      annual_fee: this.normalizeFeess(apiCard.annual_fee_text || apiCard.annual_fee),
      welcome_offer: this.extractWelcomeOffer(apiCard),
      apply_url: apiCard.network_url || apiCard.apply_url,
      tags: this.extractDetailTags(apiCard),
      features: this.extractFeatures(apiCard),
      other_info: this.extractOtherInfo(apiCard),
      cashback_rate: apiCard.reward_conversion_rate || apiCard.cashback_rate,
      reward_rate: apiCard.reward_conversion_rate || apiCard.reward_rate,
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: this.extractEligibility(apiCard)
    };
  }

  private transformCard(apiCard: any): CreditCard {
    return {
      id: apiCard.id?.toString() || apiCard.slug || 'unknown',
      name: apiCard.name || 'Unknown Card',
      nick_name: apiCard.nick_name || apiCard.name || 'Unknown Card',
      slug: apiCard.slug || apiCard.seo_card_alias || this.generateSlug(apiCard.name || ''),
      image: apiCard.image,
      bank_name: apiCard.bank_name || 'Unknown Bank',
      bank_id: apiCard.bank_id,
      joining_fee: this.normalizeFeess(apiCard.joining_fee),
      annual_fee: this.normalizeFeess(apiCard.annual_fee),
      welcome_offer: apiCard.welcome_offer || this.extractWelcomeOffer(apiCard),
      apply_url: apiCard.apply_url || apiCard.network_url,
      tags: this.extractTags(apiCard),
      features: Array.isArray(apiCard.features) ? apiCard.features : this.extractFeatures(apiCard),
      other_info: Array.isArray(apiCard.other_info) ? apiCard.other_info : [],
      cashback_rate: apiCard.cashback_rate,
      reward_rate: apiCard.reward_rate,
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: Array.isArray(apiCard.eligibility) ? apiCard.eligibility : this.extractEligibility(apiCard)
    };
  }

  private transformCards(apiCards: any[]): CreditCard[] {
    if (!Array.isArray(apiCards)) {
      return [];
    }
    return apiCards.map(card => this.transformCard(card));
  }

  private normalizeFeess(fee: any): number | string {
    if (fee === null || fee === undefined || fee === '' || fee === '0' || fee === 0) {
      return 0;
    }
    if (typeof fee === 'string' && fee.toLowerCase().includes('free')) {
      return 0;
    }
    return fee;
  }

  private extractWelcomeOffer(card: any): string {
    if (card.welcome_offer) return card.welcome_offer;
    
    if (card.product_usps && Array.isArray(card.product_usps) && card.product_usps.length > 0) {
      const firstUsp = card.product_usps[0];
      return `${firstUsp.header}: ${firstUsp.description}`;
    }
    
    return '';
  }

  private extractDetailTags(card: any): string[] {
    const tags: string[] = [];
    
    if (this.normalizeFeess(card.joining_fee_text || card.joining_fee) === 0 || 
        this.normalizeFeess(card.annual_fee_text || card.annual_fee) === 0) {
      tags.push('ltf');
    }
    
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags.map((tag: any) => this.normalizeTag(tag)));
    }
    
    // Auto-detect categories
    const cardText = `${card.name} ${card.product_usps?.map((u: any) => u.description).join(' ')}`.toLowerCase();
    if (cardText.includes('fuel')) tags.push('fuel');
    if (cardText.includes('travel')) tags.push('travel');
    if (cardText.includes('shopping')) tags.push('shopping');
    if (cardText.includes('dining')) tags.push('dining');
    if (cardText.includes('lounge')) tags.push('airport-lounge');
    
    return [...new Set(tags)];
  }

  private extractFeatures(card: any): string[] {
    const features: string[] = [];
    
    if (card.product_usps && Array.isArray(card.product_usps)) {
      features.push(...card.product_usps.map((usp: any) => `${usp.header}: ${usp.description}`));
    }
    
    if (card.product_benefits && Array.isArray(card.product_benefits)) {
      card.product_benefits.forEach((benefit: any) => {
        if (benefit.html_text) {
          const text = benefit.html_text.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
          if (text) features.push(text);
        }
      });
    }
    
    if (card.features && Array.isArray(card.features)) {
      features.push(...card.features);
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
    
    if (card.other_info && Array.isArray(card.other_info)) {
      info.push(...card.other_info);
    }
    
    return info;
  }

  private extractEligibility(card: any): string[] {
    const eligibility: string[] = [];
    
    if (card.age_criteria) eligibility.push(`Age: ${card.age_criteria} years`);
    if (card.income) eligibility.push(`Income: ₹${card.income}+ per month`);
    if (card.crif) eligibility.push(`Credit Score: ${card.crif}+`);
    
    if (card.eligibility && Array.isArray(card.eligibility)) {
      eligibility.push(...card.eligibility);
    }
    
    return eligibility;
  }

  private extractTags(card: any): string[] {
    const tags: string[] = [];
    
    if (this.normalizeFeess(card.joining_fee) === 0) {
      tags.push('ltf');
    }
    
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
    const usps = card.product_usps ? card.product_usps.map((u: any) => u.description).join(' ').toLowerCase() : '';
    const allText = `${features} ${otherInfo} ${usps}`;
    
    return allText.includes('lounge') || allText.includes('airport lounge') || allText.includes('priority pass');
  }

  private initializeFuse(cards: CreditCard[] = this.allCards) {
    if (cards.length > 0) {
      const options = {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'bank_name', weight: 0.5 },
          { name: 'features', weight: 0.3 },
          { name: 'tags', weight: 0.4 }
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2
      };
      
      this.fuse = new Fuse(cards, options);
    }
  }
}

export const cardService = new CardService();
