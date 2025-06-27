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
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data || {}),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      
      // If it's a timeout or network error, return cached data if available
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log(`Returning cached data due to network error for ${endpoint}`);
          return cached.data;
        }
      }
      
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

  private enhancedSearch(cards: CreditCard[], query: string): CreditCard[] {
    if (!query || query.trim().length === 0) return cards;

    // Initialize Fuse.js for fuzzy search
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'nick_name', weight: 0.3 },
        { name: 'bank_name', weight: 0.2 },
        { name: 'features', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true
    };

    const fuse = new Fuse(cards, fuseOptions);
    const fuseResults = fuse.search(query);
    
    // Extract cards from Fuse results and add relevance scores
    const searchResults = fuseResults.map(result => ({
      ...result.item,
      relevanceScore: 1 - (result.score || 0) // Convert Fuse score to relevance score
    }));

    // If Fuse didn't find enough results, try manual keyword matching
    if (searchResults.length < 5) {
      const manualResults = this.keywordSearch(cards, query);
      const combinedResults = [...searchResults];
      
      // Add manual results that aren't already included
      manualResults.forEach(card => {
        if (!combinedResults.some(c => c.id === card.id)) {
          combinedResults.push({ ...card, relevanceScore: card.relevanceScore || 0 });
        }
      });
      
      return combinedResults;
    }

    return searchResults;
  }

  private keywordSearch(cards: CreditCard[], query: string): CreditCard[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return cards.filter(card => {
      const searchableText = `
        ${card.name || ''} 
        ${card.nick_name || ''} 
        ${card.bank_name || ''} 
        ${card.features?.join(' ') || ''}
        ${card.tags?.join(' ') || ''}
      `.toLowerCase();
      
      return searchTerms.some(term => searchableText.includes(term));
    }).map(card => ({
      ...card,
      relevanceScore: this.calculateKeywordRelevance(card, searchTerms)
    }));
  }

  private calculateKeywordRelevance(card: CreditCard, searchTerms: string[]): number {
    let score = 0;
    const cardName = (card.name || '').toLowerCase();
    const cardNickname = (card.nick_name || '').toLowerCase();
    const bankName = (card.bank_name || '').toLowerCase();
    
    searchTerms.forEach(term => {
      if (cardName.startsWith(term)) score += 10;
      else if (cardName.includes(term)) score += 5;
      
      if (cardNickname.startsWith(term)) score += 8;
      else if (cardNickname.includes(term)) score += 4;
      
      if (bankName.includes(term)) score += 3;
    });
    
    return score / 100; // Normalize to 0-1 range
  }

  async searchCards(
    query: string = '', 
    tagSlugs: string[] = [], 
    bankIds: string[] = [], 
    freeCards: boolean = false
  ): Promise<CreditCard[]> {
    try {
      console.log('Local search parameters:', { query, tagSlugs, bankIds, freeCards });

      // Ensure we have all cards loaded for local search
      if (this.allCards.length === 0) {
        console.log('Loading all cards for local search...');
        await this.getAllCards();
      }

      let filteredCards = [...this.allCards];

      // Apply search query filter (search in card name)
      if (query && query.trim()) {
        const normalizedQuery = this.normalizeSearchQuery(query);
        filteredCards = filteredCards.filter(card => {
          const cardName = (card.name || '').toLowerCase();
          const cardNickname = (card.nick_name || '').toLowerCase();
          const queryLower = normalizedQuery.toLowerCase();
          
          return cardName.includes(queryLower) || cardNickname.includes(queryLower);
        });
        console.log(`Search query "${query}" filtered to ${filteredCards.length} cards`);
      }

      // Apply tag filtering
      if (tagSlugs.length > 0) {
        filteredCards = this.enhancedTagFilter(filteredCards, tagSlugs);
        console.log(`Tag filtering with ${tagSlugs.length} tags: ${filteredCards.length} cards remaining`);
      }

      // Apply bank filtering
      if (bankIds.length > 0) {
        filteredCards = filteredCards.filter(card => {
          const cardBankId = this.extractBankId(card);
          return cardBankId && bankIds.includes(cardBankId);
        });
        console.log(`Bank filtering with ${bankIds.length} banks: ${filteredCards.length} cards remaining`);
      }

      // Apply free cards filter
      if (freeCards) {
        filteredCards = filteredCards.filter(card => {
          const isLTF = this.normalizeFeess(card.joining_fee) === 0 || 
                       this.normalizeFeess(card.annual_fee) === 0;
          return isLTF;
        });
        console.log(`Free cards filter: ${filteredCards.length} cards remaining`);
      }

      // Apply relevance scoring and sorting
      filteredCards = this.finalizeRelevanceScores(filteredCards, query, tagSlugs, bankIds, freeCards);
      
      console.log('Local search results:', filteredCards.length, 'cards found');
      return filteredCards.slice(0, 50); // Limit to top 50 results
    } catch (error) {
      console.error('Error in local searchCards:', error);
      return [];
    }
  }

  private enhancedTagFilter(cards: CreditCard[], tagSlugs: string[]): CreditCard[] {
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

  private enhanceBankCards(cards: CreditCard[], bankIds: string[]): CreditCard[] {
    return cards.map(card => {
      const cardBankId = this.extractBankId(card);
      if (cardBankId && bankIds.includes(cardBankId)) {
        // Add bank-specific tags
        const bankTags = this.bankTagMapping[cardBankId as keyof typeof this.bankTagMapping] || [];
        const existingTags = card.tags || [];
        
        return {
          ...card,
          tags: [...new Set([...existingTags, ...bankTags])],
          relevanceScore: (card.relevanceScore || 0) + 0.2 // Boost bank-matched cards
        };
      }
      return card;
    });
  }

  private finalizeRelevanceScores(
    cards: CreditCard[], 
    query: string, 
    tagSlugs: string[], 
    bankIds: string[], 
    freeCards: boolean
  ): CreditCard[] {
    return cards.map(card => {
      let baseScore = card.relevanceScore || 0;
      
      // Name matching boost
      if (query) {
        const cardName = (card.name || '').toLowerCase();
        const cardNickname = (card.nick_name || '').toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (cardName.includes(queryLower)) baseScore += 0.3;
        if (cardNickname.includes(queryLower)) baseScore += 0.25;
        if (cardName.startsWith(queryLower)) baseScore += 0.2;
      }
      
      // Tag matching boost
      if (tagSlugs.length > 0 && card.tags) {
        const matchingTags = tagSlugs.filter(slug => 
          card.tags?.some(tag => this.normalizeTag(tag) === slug)
        );
        baseScore += matchingTags.length * 0.15;
      }
      
      // Bank matching boost
      if (bankIds.length > 0) {
        const cardBankId = this.extractBankId(card);
        if (cardBankId && bankIds.includes(cardBankId)) {
          baseScore += 0.25;
        }
      }
      
      // Free card boost
      if (freeCards) {
        const isLTF = this.normalizeFeess(card.joining_fee) === 0 || 
                     this.normalizeFeess(card.annual_fee) === 0;
        if (isLTF) baseScore += 0.1;
      }
      
      return { ...card, relevanceScore: baseScore };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
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

  private extractBankId(card: CreditCard): string | null {
    if (card.bank_id) return card.bank_id.toString();
    
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
      
      // If no cards in response, use fallback data
      console.log('No cards in API response, using fallback data');
      this.allCards = this.getFallbackCardData();
      return this.allCards;
    } catch (error) {
      console.error('Error in getAllCards:', error);
      // Return fallback data when API fails
      console.log('API failed, using fallback card data');
      this.allCards = this.getFallbackCardData();
      return this.allCards;
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
      console.log('Fetching enhanced card details for slug:', slug);
      
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
          const matchingCard = response.data.cards.find((card: any) => 
            card.seo_card_alias === slug || card.card_alias === slug
          );
          if (matchingCard) {
            return this.transformDetailCard(matchingCard);
          }
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
    const cardText = `${card.name} ${card.features?.join(' ')} ${card.other_info?.join(' ')}`.toLowerCase();
    
    const tagKeywords: { [key: string]: string[] } = {
      'best-fuel-credit-card': ['fuel', 'petrol', 'diesel', 'gas', 'hpcl', 'bpcl', 'iocl', 'shell', 'reliance'],
      'best-shopping-credit-card': ['shopping', 'retail', 'e-commerce', 'online shopping', 'cashback', 'amazon', 'flipkart'],
      'A-b-c-d': ['lounge', 'airport', 'priority pass', 'vip', 'plaza premium'],
      'best-travel-credit-card': ['travel', 'miles', 'airline', 'hotel', 'air miles', 'makemytrip', 'cleartrip'],
      'best-dining-credit-card': ['dining', 'restaurant', 'food', 'zomato', 'swiggy', 'uber eats'],
      'BestCardsforGroceryShopping': ['grocery', 'supermarket', 'big bazaar', 'dmart', 'reliance fresh'],
      'best-utility-credit-card': ['utility', 'bill payment', 'electricity', 'mobile recharge', 'broadband'],
      'best-cashback-credit-card': ['cashback', 'cash back', 'rewards', 'points', 'back']
    };
    
    const keywords = tagKeywords[slug] || [];
    return keywords.some(keyword => cardText.includes(keyword));
  }

  private transformDetailCard(apiCard: any): CreditCard {
    console.log('Transforming enhanced detailed card:', apiCard);
    
    const baseCard = this.transformCard(apiCard);
    
    return {
      ...baseCard,
      features: this.extractEnhancedFeatures(apiCard),
      other_info: this.extractEnhancedOtherInfo(apiCard),
      tags: this.extractEnhancedDetailTags(apiCard),
      eligibility: this.extractEnhancedEligibility(apiCard)
    };
  }

  private transformCard(apiCard: any): CreditCard {
    const bankId = this.extractBankIdFromCard(apiCard);
    const enhancedTags = this.extractEnhancedTags(apiCard, bankId);
    
    return {
      id: apiCard.id?.toString() || 'unknown',
      name: apiCard.name || 'Unknown Card',
      nick_name: apiCard.nick_name || apiCard.name || 'Unknown Card',
      slug: apiCard.seo_card_alias || apiCard.card_alias || this.generateSlug(apiCard.name || ''),
      image: apiCard.image,
      bank_name: this.getBankNameById(apiCard.bank_id) || 'Unknown Bank',
      bank_id: apiCard.bank_id,
      joining_fee: this.normalizeFeess(apiCard.joining_fee_text || apiCard.joining_fee),
      annual_fee: this.normalizeFeess(apiCard.annual_fee_text || apiCard.annual_fee),
      welcome_offer: this.extractWelcomeOffer(apiCard),
      apply_url: apiCard.network_url,
      tags: enhancedTags,
      features: this.extractFeatures(apiCard),
      other_info: [],
      cashback_rate: this.extractCashbackRate(apiCard),
      reward_rate: this.extractRewardRate(apiCard),
      lounge_access: this.hasLoungeAccess(apiCard),
      eligibility: this.extractEligibility(apiCard),
      relevanceScore: 0
    };
  }

  private getBankNameById(bankId: number): string {
    const bank = this.banks.find(b => b.id === bankId?.toString());
    return bank?.name || 'Unknown Bank';
  }

  private extractCashbackRate(card: any): string | number {
    if (card.product_usps && Array.isArray(card.product_usps)) {
      const cashbackUsp = card.product_usps.find((usp: any) => 
        usp.header?.toLowerCase().includes('cashback') || 
        usp.description?.toLowerCase().includes('cashback')
      );
      if (cashbackUsp) {
        return `${cashbackUsp.header}: ${cashbackUsp.description}`;
      }
    }
    return '';
  }

  private extractRewardRate(card: any): string | number {
    if (card.product_usps && Array.isArray(card.product_usps)) {
      const rewardUsp = card.product_usps.find((usp: any) => 
        usp.header?.toLowerCase().includes('reward') || 
        usp.description?.toLowerCase().includes('reward')
      );
      if (rewardUsp) {
        return `${rewardUsp.header}: ${rewardUsp.description}`;
      }
    }
    return '';
  }

  private extractBankIdFromCard(card: any): string | null {
    if (card.bank_id) return card.bank_id.toString();
    
    // Try to match by bank name
    const matchingBank = this.banks.find(bank => 
      bank.name.toLowerCase() === (card.bank_name || '').toLowerCase()
    );
    
    return matchingBank ? matchingBank.id : null;
  }

  private extractEnhancedTags(card: any, bankId: string | null): string[] {
    const tags: string[] = [];
    
    // LTF detection - check both joining_fee_text and annual_fee_text
    if (this.normalizeFeess(card.joining_fee_text || card.joining_fee) === 0 || 
        this.normalizeFeess(card.annual_fee_text || card.annual_fee) === 0) {
      tags.push('ltf');
    }
    
    // Extract tags from the API response format
    if (card.tags && Array.isArray(card.tags)) {
      card.tags.forEach((tag: any) => {
        if (tag.name) {
          tags.push(tag.name.toLowerCase());
        }
      });
    }
    
    // Bank-specific tags
    if (bankId && this.bankTagMapping[bankId as keyof typeof this.bankTagMapping]) {
      tags.push(...this.bankTagMapping[bankId as keyof typeof this.bankTagMapping]);
    }
    
    // Auto-detect categories from card content
    const cardText = `${card.name} ${card.product_usps?.map((u: any) => u.description).join(' ')}`.toLowerCase();
    
    if (cardText.includes('fuel') || cardText.includes('petrol')) tags.push('fuel');
    if (cardText.includes('travel') || cardText.includes('miles')) tags.push('travel');
    if (cardText.includes('shopping') || cardText.includes('retail')) tags.push('shopping');
    if (cardText.includes('dining') || cardText.includes('restaurant')) tags.push('dining');
    if (cardText.includes('lounge') || cardText.includes('airport')) tags.push('airport-lounge');
    if (cardText.includes('grocery') || cardText.includes('supermarket')) tags.push('grocery');
    if (cardText.includes('cashback') || cardText.includes('cash back')) tags.push('cashback');
    if (cardText.includes('reward') || cardText.includes('points')) tags.push('rewards');
    
    return [...new Set(tags)];
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

  private extractEnhancedDetailTags(card: any): string[] {
    const tags: string[] = [];
    
    if (this.normalizeFeess(card.joining_fee_text || card.joining_fee) === 0 || 
        this.normalizeFeess(card.annual_fee_text || card.annual_fee) === 0) {
      tags.push('ltf');
    }
    
    if (card.tags && Array.isArray(card.tags)) {
      tags.push(...card.tags.map((tag: any) => this.normalizeTag(tag)));
    }
    
    // Enhanced auto-detection
    const cardText = `${card.name} ${card.product_usps?.map((u: any) => u.description).join(' ')} ${card.product_benefits?.map((b: any) => b.html_text).join(' ')}`.toLowerCase();
    
    const categoryKeywords = {
      fuel: ['fuel', 'petrol', 'diesel', 'gas', 'hpcl', 'bpcl'],
      travel: ['travel', 'airline', 'hotel', 'miles', 'vacation'],
      shopping: ['shopping', 'retail', 'online', 'amazon', 'flipkart'],
      dining: ['dining', 'restaurant', 'food', 'zomato', 'swiggy'],
      'airport-lounge': ['lounge', 'airport', 'priority', 'vip'],
      grocery: ['grocery', 'supermarket', 'big bazaar', 'dmart'],
      cashback: ['cashback', 'cash back', 'rewards', 'points'],
      premium: ['premium', 'luxury', 'elite', 'exclusive']
    };
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => cardText.includes(keyword))) {
        tags.push(category);
      }
    });
    
    return [...new Set(tags)];
  }

  private extractEnhancedFeatures(card: any): string[] {
    const features: string[] = [];
    
    // Extract features from product_usps
    if (card.product_usps && Array.isArray(card.product_usps)) {
      card.product_usps.forEach((usp: any) => {
        if (usp.header && usp.description) {
          features.push(`${usp.header}: ${usp.description}`);
        }
      });
    }
    
    // Add any existing features array
    if (card.features && Array.isArray(card.features)) {
      features.push(...card.features);
    }
    
    return features;
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
    
    // Extract features from product_usps
    if (card.product_usps && Array.isArray(card.product_usps)) {
      card.product_usps.forEach((usp: any) => {
        if (usp.header && usp.description) {
          features.push(`${usp.header}: ${usp.description}`);
        }
      });
    }
    
    // Add any existing features array
    if (card.features && Array.isArray(card.features)) {
      features.push(...card.features);
    }
    
    return features;
  }

  private extractEnhancedEligibility(card: any): string[] {
    const eligibility: string[] = [];
    
    // Age criteria
    if (card.age_criteria) {
      eligibility.push(`Age: ${card.age_criteria}`);
    }
    
    // Income criteria
    if (card.income) {
      eligibility.push(`Income: ₹${card.income} per month`);
    }
    
    // CRIF score
    if (card.crif) {
      eligibility.push(`Credit Score: ${card.crif}+`);
    }
    
    // Employment type
    if (card.employment_type) {
      eligibility.push(`Employment: ${card.employment_type === 'both' ? 'Salaried & Self-employed' : card.employment_type}`);
    }
    
    // New to credit
    if (card.new_to_credit) {
      eligibility.push('New to Credit: Yes');
    }
    
    // Existing customer
    if (card.existing_customer) {
      eligibility.push('Existing Customer: Yes');
    }
    
    return eligibility;
  }

  private extractEligibility(card: any): string[] {
    const eligibility: string[] = [];
    
    // Age criteria
    if (card.age_criteria) {
      eligibility.push(`Age: ${card.age_criteria}`);
    }
    
    // Income criteria
    if (card.income) {
      eligibility.push(`Income: ₹${card.income} per month`);
    }
    
    // CRIF score
    if (card.crif) {
      eligibility.push(`Credit Score: ${card.crif}+`);
    }
    
    // Employment type
    if (card.employment_type) {
      eligibility.push(`Employment: ${card.employment_type === 'both' ? 'Salaried & Self-employed' : card.employment_type}`);
    }
    
    // New to credit
    if (card.new_to_credit) {
      eligibility.push('New to Credit: Yes');
    }
    
    // Existing customer
    if (card.existing_customer) {
      eligibility.push('Existing Customer: Yes');
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
    const cardText = `${card.name} ${card.product_usps?.map((u: any) => u.description).join(' ')} ${card.tags?.map((t: any) => t.name).join(' ')}`.toLowerCase();
    
    return cardText.includes('lounge') || 
           cardText.includes('airport') || 
           cardText.includes('priority pass') ||
           cardText.includes('plaza premium');
  }

  private getFallbackCardData(): CreditCard[] {
    const fallbackCards: CreditCard[] = [
      {
        id: '1',
        name: 'HDFC Regalia Credit Card',
        nick_name: 'HDFC Regalia',
        slug: 'hdfc-regalia-credit-card',
        image: '',
        bank_name: 'HDFC Bank',
        bank_id: 1,
        joining_fee: 2500,
        annual_fee: 2500,
        welcome_offer: 'Welcome bonus of 10,000 reward points',
        apply_url: '#',
        tags: ['premium', 'travel', 'rewards'],
        features: ['Airport lounge access', 'Travel insurance', 'Reward points'],
        other_info: [],
        cashback_rate: '2% on all spends',
        reward_rate: '4X reward points on travel',
        lounge_access: true,
        eligibility: ['Age: 21-60 years', 'Income: ₹12 lakhs per annum'],
        relevanceScore: 0
      },
      {
        id: '2',
        name: 'SBI SimplyCLICK Credit Card',
        nick_name: 'SBI SimplyCLICK',
        slug: 'sbi-simplyclick-credit-card',
        image: '',
        bank_name: 'SBI Card',
        bank_id: 2,
        joining_fee: 999,
        annual_fee: 999,
        welcome_offer: 'Welcome voucher worth ₹500',
        apply_url: '#',
        tags: ['shopping', 'online', 'cashback'],
        features: ['10X reward points on online shopping', '5% cashback on movie tickets'],
        other_info: [],
        cashback_rate: '5% on online shopping',
        reward_rate: '10X reward points',
        lounge_access: false,
        eligibility: ['Age: 21-60 years', 'Income: ₹6 lakhs per annum'],
        relevanceScore: 0
      },
      {
        id: '3',
        name: 'Axis Flipkart Credit Card',
        nick_name: 'Axis Flipkart',
        slug: 'axis-flipkart-credit-card',
        image: '',
        bank_name: 'Axis Bank',
        bank_id: 3,
        joining_fee: 0,
        annual_fee: 0,
        welcome_offer: '5% unlimited cashback on Flipkart',
        apply_url: '#',
        tags: ['ltf', 'shopping', 'cashback'],
        features: ['5% unlimited cashback on Flipkart', '4% rewards on preferred merchants'],
        other_info: [],
        cashback_rate: '5% on Flipkart',
        reward_rate: '4% on preferred merchants',
        lounge_access: false,
        eligibility: ['Age: 18-70 years', 'Income: ₹4 lakhs per annum'],
        relevanceScore: 0
      }
    ];
    
    return fallbackCards;
  }
}

export const cardService = new CardService();
