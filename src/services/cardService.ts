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

  // Enhanced Bank to Tag mapping for better categorization
  private bankTagMapping = {
    '1': ['hdfc', 'premium', 'travel', 'rewards', 'lifestyle'], // HDFC Bank
    '2': ['sbi', 'government', 'fuel', 'cashback', 'utility'], // SBI Card
    '3': ['axis', 'lifestyle', 'rewards', 'travel', 'dining'], // Axis Bank
    '4': ['kotak', 'digital', 'cashback', 'shopping', 'utility'], // Kotak Bank
    '14': ['icici', 'banking', 'shopping', 'fuel', 'travel'], // ICICI Bank
    '5': ['indusind', 'premium', 'dining', 'travel', 'rewards'], // IndusInd Bank
    '6': ['standard-chartered', 'premium', 'travel', 'cashback'], // Standard Chartered
    '7': ['citibank', 'premium', 'rewards', 'travel', 'cashback'], // Citibank
    '8': ['american-express', 'premium', 'travel', 'rewards', 'dining'], // American Express
    '9': ['yes-bank', 'lifestyle', 'rewards', 'shopping', 'dining'] // Yes Bank
  };

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
      
      // Enhanced fallback data with proper mapping
      return this.getEnhancedFallbackData();
    }
  }

  private getEnhancedFallbackData() {
    const fallbackBanks = [
      { id: '1', name: 'HDFC Bank', logo: '', slug: 'hdfc-bank' },
      { id: '2', name: 'SBI Card', logo: '', slug: 'sbi-card' },
      { id: '3', name: 'Axis Bank', logo: '', slug: 'axis-bank' },
      { id: '4', name: 'Kotak Mahindra Bank', logo: '', slug: 'kotak-bank' },
      { id: '14', name: 'ICICI Bank', logo: '', slug: 'icici-bank' },
      { id: '5', name: 'IndusInd Bank', logo: '', slug: 'indusind-bank' },
      { id: '6', name: 'Standard Chartered', logo: '', slug: 'standard-chartered' },
      { id: '7', name: 'Citibank', logo: '', slug: 'citibank' },
      { id: '8', name: 'American Express', logo: '', slug: 'american-express' },
      { id: '9', name: 'Yes Bank', logo: '', slug: 'yes-bank' }
    ];
    
    const fallbackTags = [
      { id: '1', name: 'Fuel', slug: 'best-fuel-credit-card', description: 'Best for fuel purchases and petrol stations' },
      { id: '2', name: 'Shopping', slug: 'best-shopping-credit-card', description: 'Best for online and offline shopping rewards' },
      { id: '3', name: 'Cashback', slug: 'best-cashback-credit-card', description: 'High cashback on all purchases' },
      { id: '4', name: 'Airport Lounge', slug: 'A-b-c-d', description: 'Airport lounge access and priority services' },
      { id: '12', name: 'Travel', slug: 'best-travel-credit-card', description: 'Best for travel bookings and air miles' },
      { id: '13', name: 'Dining', slug: 'best-dining-credit-card', description: 'Best for restaurant and food delivery rewards' },
      { id: '14', name: 'Grocery', slug: 'BestCardsforGroceryShopping', description: 'Best for grocery shopping and supermarkets' },
      { id: '15', name: 'Utility Bills', slug: 'best-utility-credit-card', description: 'Best for utility bill payments' },
      { id: '16', name: 'Premium', slug: 'premium-credit-cards', description: 'Premium and luxury credit cards' },
      { id: '17', name: 'Business', slug: 'business-credit-cards', description: 'Best for business expenses' }
    ];
    
    this.banks = fallbackBanks;
    this.tags = fallbackTags;
    
    return { banks: fallbackBanks, tags: fallbackTags };
  }

  private initializeFuseSearch(cards: CreditCard[]) {
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'nick_name', weight: 0.3 },
        { name: 'bank_name', weight: 0.3 },
        { name: 'features', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2
    };

    this.fuse = new Fuse(cards, fuseOptions);
  }

  private performFuzzySearch(cards: CreditCard[], query: string): CreditCard[] {
    if (!query || query.trim().length < 2) return cards;

    // Initialize Fuse if not already done or if cards changed
    if (!this.fuse || this.allCards.length !== cards.length) {
      this.initializeFuseSearch(cards);
    }

    const fuseResults = this.fuse!.search(query);
    
    // Convert Fuse results to cards with relevance scores
    const searchResults = fuseResults.map(result => ({
      ...result.item,
      relevanceScore: 1 - (result.score || 0)
    }));

    // If we have few results, try keyword matching
    if (searchResults.length < 10) {
      const keywordResults = this.performKeywordSearch(cards, query);
      
      // Merge results, avoiding duplicates
      keywordResults.forEach(card => {
        if (!searchResults.some(c => c.id === card.id)) {
          searchResults.push({
            ...card,
            relevanceScore: card.relevanceScore || 0
          });
        }
      });
    }

    return searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private performKeywordSearch(cards: CreditCard[], query: string): CreditCard[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return cards.map(card => {
      const searchableText = `
        ${card.name || ''} 
        ${card.nick_name || ''} 
        ${card.bank_name || ''} 
        ${card.features?.join(' ') || ''}
      `.toLowerCase();
      
      let score = 0;
      const cardName = (card.name || '').toLowerCase();
      const bankName = (card.bank_name || '').toLowerCase();
      
      searchTerms.forEach(term => {
        // Exact matches get higher scores
        if (cardName.includes(term)) score += cardName.startsWith(term) ? 10 : 5;
        if (bankName.includes(term)) score += bankName.startsWith(term) ? 8 : 4;
        if (searchableText.includes(term)) score += 2;
      });
      
      return {
        ...card,
        relevanceScore: score / 100
      };
    }).filter(card => (card.relevanceScore || 0) > 0);
  }

  async searchCards(
    query: string = '', 
    tagSlugs: string[] = [], 
    bankIds: string[] = [], 
    freeCards: boolean = false
  ): Promise<CreditCard[]> {
    try {
      console.log('Search parameters:', { query, tagSlugs, bankIds, freeCards });

      // Convert bank IDs to integers for API call
      const bankIdsForApi = bankIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      const requestData = {
        slug: query ? this.generateSlug(query) : '',
        banks_ids: bankIdsForApi,
        card_networks: [],
        annualFees: '',
        credit_score: '',
        sort_by: '',
        free_cards: freeCards ? '1' : '',
        eligiblityPayload: {},
        cardGeniusPayload: {}
      };

      console.log('API request payload:', requestData);
      const response: CardsResponse = await this.makeRequest('/cards', requestData);
      
      if (response?.data?.cards) {
        let cards = this.transformCards(response.data.cards);
        console.log('Raw cards from API:', cards.length);
        
        // Apply search query filtering using Fuse.js
        if (query && query.trim().length > 0) {
          cards = this.performFuzzySearch(cards, query.trim());
          console.log('After search filtering:', cards.length);
        }
        
        // Apply tag filtering
        if (tagSlugs.length > 0) {
          cards = this.filterByTags(cards, tagSlugs);
          console.log('After tag filtering:', cards.length);
        }
        
        // Apply bank filtering (client-side verification)
        if (bankIds.length > 0) {
          cards = this.filterByBanks(cards, bankIds);
          console.log('After bank filtering:', cards.length);
        }
        
        // Apply free cards filter
        if (freeCards) {
          cards = this.filterFreeCards(cards);
          console.log('After free cards filtering:', cards.length);
        }
        
        // Final sorting by relevance
        cards = cards.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        
        console.log('Final search results:', cards.length, 'cards found');
        return cards.slice(0, 50); // Limit to top 50 results
      }
      
      return [];
    } catch (error) {
      console.error('Error in searchCards:', error);
      return [];
    }
  }

  private filterByTags(cards: CreditCard[], tagSlugs: string[]): CreditCard[] {
    return cards.filter(card => {
      return tagSlugs.some(slug => {
        // Direct tag match
        if (card.tags?.some(tag => this.normalizeTag(tag) === slug)) {
          return true;
        }
        // Keyword-based matching
        return this.cardMatchesTagSlug(card, slug);
      });
    });
  }

  private filterByBanks(cards: CreditCard[], bankIds: string[]): CreditCard[] {
    return cards.filter(card => {
      const cardBankId = this.extractBankIdFromCard(card);
      return cardBankId && bankIds.includes(cardBankId);
    });
  }

  private filterFreeCards(cards: CreditCard[]): CreditCard[] {
    return cards.filter(card => {
      const joiningFee = this.normalizeFeess(card.joining_fee);
      const annualFee = this.normalizeFeess(card.annual_fee);
      return joiningFee === 0 || annualFee === 0;
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractBankIdFromCard(card: CreditCard): string | null {
    if (card.bank_id) return card.bank_id.toString();
    
    // Try to match by bank name with the banks we have
    const matchingBank = this.banks.find(bank => 
      bank.name.toLowerCase() === (card.bank_name || '').toLowerCase()
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
      return allCards.slice(0, 12);
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

  private cardMatchesTagSlug(card: CreditCard, slug: string): boolean {
    const cardText = `${card.name} ${card.features?.join(' ')} ${card.tags?.join(' ')}`.toLowerCase();
    
    const tagKeywords: { [key: string]: string[] } = {
      'best-fuel-credit-card': ['fuel', 'petrol', 'diesel', 'gas', 'hpcl', 'bpcl', 'iocl'],
      'best-shopping-credit-card': ['shopping', 'retail', 'e-commerce', 'online', 'amazon', 'flipkart'],
      'A-b-c-d': ['lounge', 'airport', 'priority pass', 'vip'],
      'best-travel-credit-card': ['travel', 'miles', 'airline', 'hotel', 'air miles'],
      'best-dining-credit-card': ['dining', 'restaurant', 'food', 'zomato', 'swiggy'],
      'BestCardsforGroceryShopping': ['grocery', 'supermarket', 'big bazaar', 'dmart'],
      'best-utility-credit-card': ['utility', 'bill payment', 'electricity', 'mobile'],
      'best-cashback-credit-card': ['cashback', 'cash back', 'rewards', 'points']
    };
    
    const keywords = tagKeywords[slug] || [];
    return keywords.some(keyword => cardText.includes(keyword));
  }

  private transformCard(apiCard: any): CreditCard {
    const bankId = this.extractBankIdFromApiCard(apiCard);
    
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
      tags: this.extractTags(apiCard, bankId),
      features: Array.isArray(apiCard.features) ? apiCard.features : this.extractFeatures(apiCard),
      other_info: Array.isArray(apiCard.other_info) ? apiCard.other_info : [],
      cashback_rate: apiCard.cashback_rate,
      reward_rate: apiCard.reward_rate,
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: Array.isArray(apiCard.eligibility) ? apiCard.eligibility : this.extractEligibility(apiCard),
      relevanceScore: 0
    };
  }

  private extractBankIdFromApiCard(card: any): string | null {
    if (card.bank_id) return card.bank_id.toString();
    
    // Try to match by bank name
    const matchingBank = this.banks.find(bank => 
      bank.name.toLowerCase() === (card.bank_name || '').toLowerCase()
    );
    
    return matchingBank ? matchingBank.id : null;
  }

  private extractTags(card: any, bankId: string | null): string[] {
    const tags: string[] = [];
    
    // LTF detection
    if (this.normalizeFeess(card.joining_fee) === 0) {
      tags.push('ltf');
    }
    
    // Existing tags
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags.map((tag: any) => this.normalizeTag(tag)));
    }
    
    return [...new Set(tags)];
  }

  private transformCards(apiCards: any[]): CreditCard[] {
    if (!Array.isArray(apiCards)) {
      return [];
    }
    return apiCards.map(card => this.transformCard(card));
  }

  private transformDetailCard(apiCard: any): CreditCard {
    console.log('Transforming detailed card:', apiCard);
    
    const baseCard = this.transformCard(apiCard);
    
    return {
      ...baseCard,
      features: this.extractEnhancedFeatures(apiCard),
      other_info: this.extractEnhancedOtherInfo(apiCard),
      eligibility: this.extractEnhancedEligibility(apiCard)
    };
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

  private extractEnhancedFeatures(card: any): string[] {
    const features: string[] = [];
    
    if (card.product_usps && Array.isArray(card.product_usps)) {
      features.push(...card.product_usps.map((usp: any) => `${usp.header}: ${usp.description}`));
    }
    
    if (card.product_benefits && Array.isArray(card.product_benefits)) {
      card.product_benefits.forEach((benefit: any) => {
        if (benefit.html_text) {
          const text = benefit.html_text.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
          if (text && text.length > 10) features.push(text);
        }
      });
    }
    
    if (card.features && Array.isArray(card.features)) {
      features.push(...card.features);
    }
    
    // Remove duplicates and sort by length (longer descriptions first)
    return [...new Set(features)].sort((a, b) => b.length - a.length);
  }

  private extractEnhancedOtherInfo(card: any): string[] {
    const info: string[] = [];
    
    if (card.bank_fee_structure) {
      const fees = card.bank_fee_structure;
      if (fees.forex_markup) info.push(`Forex Markup: ${fees.forex_markup}`);
      if (fees.apr_fees) info.push(`APR: ${fees.apr_fees}`);
      if (fees.late_payment_fine) info.push(`Late Payment: ${fees.late_payment_fine}`);
      if (fees.overlimit_fee) info.push(`Over Limit Fee: ${fees.overlimit_fee}`);
    }
    
    if (card.redemption_options) {
      const redemption = card.redemption_options.replace(/<[^>]*>/g, '').trim();
      if (redemption) info.push(`Redemption: ${redemption}`);
    }
    
    if (card.other_info && Array.isArray(card.other_info)) {
      info.push(...card.other_info);
    }
    
    return info;
  }

  private extractFeatures(card: any): string[] {
    const features: string[] = [];
    
    if (card.product_usps && Array.isArray(card.product_usps)) {
      features.push(...card.product_usps.map((usp: any) => `${usp.header}: ${usp.description}`));
    }
    
    if (card.features && Array.isArray(card.features)) {
      features.push(...card.features);
    }
    
    return features;
  }

  private extractEnhancedEligibility(card: any): string[] {
    const eligibility: string[] = [];
    
    if (card.age_criteria) eligibility.push(`Age: ${card.age_criteria} years`);
    if (card.income) eligibility.push(`Income: ₹${card.income}+ per month`);
    if (card.crif) eligibility.push(`Credit Score: ${card.crif}+`);
    if (card.employment_type) eligibility.push(`Employment: ${card.employment_type}`);
    
    if (card.eligibility && Array.isArray(card.eligibility)) {
      eligibility.push(...card.eligibility);
    }
    
    return eligibility;
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
}

export const cardService = new CardService();
