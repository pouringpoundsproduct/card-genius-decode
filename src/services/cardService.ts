
import Fuse from 'fuse.js';
import { CreditCard } from '../types/card';

const API_BASE = 'https://bk-api.bankkaro.com/sp/api';

// Cache for banks and tags data
let banksCache: any[] = [];
let tagsCache: any[] = [];
let cacheInitialized = false;

interface CardSearchParams {
  slug?: string;
  banks_ids?: string[];
  card_networks?: string[];
  annualFees?: string;
  credit_score?: string;
  sort_by?: string;
  free_cards?: string;
  page?: number;
  limit?: number;
  eligiblityPayload?: any;
  cardGeniusPayload?: any;
}

interface ApiResponse {
  data: CreditCard[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class CardService {
  private async fetchBanksAndTags() {
    if (cacheInitialized) {
      return { banks: banksCache, tags: tagsCache };
    }

    try {
      console.log('Fetching banks and tags from API...');
      const response = await fetch(`${API_BASE}/bank-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Banks/tags API response:', result);
      
      if (result.success && result.data) {
        banksCache = Array.isArray(result.data.banks) ? result.data.banks : [];
        tagsCache = Array.isArray(result.data.tags) ? result.data.tags : [];
        cacheInitialized = true;
        console.log('Banks and tags cached:', { banks: banksCache.length, tags: tagsCache.length });
      } else {
        console.warn('Invalid banks/tags response structure');
        banksCache = [];
        tagsCache = [];
      }

      return { banks: banksCache, tags: tagsCache };
    } catch (error) {
      console.error('Error fetching banks and tags:', error);
      // Provide minimal fallback data
      banksCache = [];
      tagsCache = [];
      return { banks: banksCache, tags: tagsCache };
    }
  }

  private async fetchCards(params: CardSearchParams = {}): Promise<ApiResponse> {
    try {
      console.log('Fetching cards with params:', params);
      const requestBody = {
        slug: params.slug || "",
        banks_ids: params.banks_ids || [],
        card_networks: params.card_networks || [],
        annualFees: params.annualFees || "",
        credit_score: params.credit_score || "",
        sort_by: params.sort_by || "",
        free_cards: params.free_cards || "",
        eligiblityPayload: params.eligiblityPayload || {},
        cardGeniusPayload: params.cardGeniusPayload || {}
      };

      const response = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Cards API response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const cards = result.data.map((card: any) => this.transformCard(card));
        console.log('Transformed cards:', cards.length);
        
        return {
          data: cards,
          total: result.total_records || result.data.length,
          page: result.current_page || 1,
          limit: result.per_page || 20,
          hasMore: result.has_more_pages || false
        };
      }

      console.warn('No valid data in cards response');
      return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
  }

  private transformCard(apiCard: any): CreditCard {
    // Find the bank info from the cached banks data
    const bankInfo = banksCache.find(bank => 
      bank.id === apiCard.bank_id || 
      bank.id === String(apiCard.bank_id) ||
      bank.name === apiCard.bank_name
    );
    
    return {
      id: apiCard.id || apiCard.card_id || Math.random().toString(),
      name: apiCard.name || apiCard.card_name || 'Credit Card',
      nick_name: apiCard.nick_name || apiCard.nickname || '',
      slug: apiCard.slug || apiCard.id || Math.random().toString(),
      image: apiCard.image || apiCard.card_image || apiCard.img_url || '',
      bank_name: bankInfo?.name || apiCard.bank_name || 'Bank',
      bank_id: apiCard.bank_id || '',
      joining_fee: apiCard.joining_fee || apiCard.joiningFee || 0,
      annual_fee: apiCard.annual_fee || apiCard.annualFee || 0,
      welcome_offer: apiCard.welcome_offer || apiCard.welcome_bonus || apiCard.welcomeOffer || '',
      features: this.extractFeatures(apiCard),
      tags: this.extractTags(apiCard),
      cashback_rate: apiCard.cashback_rate || apiCard.cashbackRate || '',
      reward_rate: apiCard.reward_rate || apiCard.rewardRate || apiCard.rewards || '',
      eligibility: this.extractEligibility(apiCard),
      other_info: this.extractOtherInfo(apiCard),
      lounge_access: apiCard.lounge_access || apiCard.loungeAccess || apiCard.airport_lounge || false,
      apply_url: apiCard.apply_url || apiCard.applyUrl || apiCard.application_url || '',
      relevanceScore: 0
    };
  }

  private extractFeatures(apiCard: any): string[] {
    const features = [];
    if (Array.isArray(apiCard.features)) features.push(...apiCard.features);
    if (Array.isArray(apiCard.benefits)) features.push(...apiCard.benefits);
    if (Array.isArray(apiCard.key_features)) features.push(...apiCard.key_features);
    if (apiCard.description) features.push(apiCard.description);
    return features.filter(f => f && typeof f === 'string');
  }

  private extractTags(apiCard: any): string[] {
    const tags = [];
    if (Array.isArray(apiCard.tags)) {
      tags.push(...apiCard.tags.map(tag => 
        typeof tag === 'string' ? tag : (tag.name || tag.slug || tag.id)
      ));
    }
    if (Array.isArray(apiCard.categories)) {
      tags.push(...apiCard.categories.map(cat => 
        typeof cat === 'string' ? cat : (cat.name || cat.slug || cat.id)
      ));
    }
    return tags.filter(t => t && typeof t === 'string');
  }

  private extractEligibility(apiCard: any): string[] {
    const eligibility = [];
    if (Array.isArray(apiCard.eligibility)) eligibility.push(...apiCard.eligibility);
    if (Array.isArray(apiCard.eligibility_criteria)) eligibility.push(...apiCard.eligibility_criteria);
    if (apiCard.min_income) eligibility.push(`Minimum Income: ₹${apiCard.min_income}`);
    if (apiCard.min_age) eligibility.push(`Minimum Age: ${apiCard.min_age} years`);
    if (apiCard.credit_score) eligibility.push(`Credit Score: ${apiCard.credit_score}+`);
    return eligibility.filter(e => e && typeof e === 'string');
  }

  private extractOtherInfo(apiCard: any): string[] {
    const info = [];
    if (Array.isArray(apiCard.other_info)) info.push(...apiCard.other_info);
    if (Array.isArray(apiCard.additional_info)) info.push(...apiCard.additional_info);
    if (apiCard.terms_conditions) info.push(apiCard.terms_conditions);
    if (apiCard.processing_time) info.push(`Processing Time: ${apiCard.processing_time}`);
    return info.filter(i => i && typeof i === 'string');
  }

  async getBanksAndTags() {
    return await this.fetchBanksAndTags();
  }

  async searchCards(
    query: string = '', 
    selectedTags: string[] = [], 
    selectedBankIds: string[] = [],
    freeCards: boolean = false,
    page: number = 1,
    limit: number = 20
  ): Promise<CreditCard[]> {
    console.log('searchCards called:', { query, selectedTags, selectedBankIds, freeCards, page, limit });

    try {
      // Ensure banks and tags are loaded
      await this.fetchBanksAndTags();

      const params: CardSearchParams = {
        banks_ids: selectedBankIds,
        free_cards: freeCards ? "true" : "",
        sort_by: query ? "relevance" : "popular"
      };

      const response = await this.fetchCards(params);
      let cards = response.data;

      // Apply tag filtering on client side
      if (selectedTags.length > 0) {
        cards = cards.filter(card => 
          card.tags && card.tags.some((tag: any) => {
            const tagSlug = typeof tag === 'string' ? tag : (tag.slug || tag.name || tag.id);
            return selectedTags.includes(tagSlug);
          })
        );
      }

      // Apply search query filtering if query exists
      if (query.trim()) {
        const fuse = new Fuse(cards, {
          keys: [
            { name: 'name', weight: 0.4 },
            { name: 'bank_name', weight: 0.3 },
            { name: 'nick_name', weight: 0.2 },
            { name: 'features', weight: 0.1 }
          ],
          threshold: 0.4,
          includeScore: true
        });

        const fuzzyResults = fuse.search(query);
        cards = fuzzyResults.map(result => ({
          ...result.item,
          relevanceScore: 1 - (result.score || 0)
        }));
      }

      console.log('Final search results:', cards.length, 'cards found');
      return cards;
    } catch (error) {
      console.error('Error in searchCards:', error);
      throw error;
    }
  }

  async getAllCards(page: number = 1, limit: number = 20): Promise<{cards: CreditCard[], hasMore: boolean, total: number}> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ sort_by: "popular" });
      
      // Implement client-side pagination for now
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCards = response.data.slice(startIndex, endIndex);
      
      return {
        cards: paginatedCards,
        hasMore: endIndex < response.data.length,
        total: response.data.length
      };
    } catch (error) {
      console.error('Error loading all cards:', error);
      throw error;
    }
  }

  async getFeaturedCards(): Promise<CreditCard[]> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ sort_by: "featured" });
      return response.data.slice(0, 6); // Return first 6 cards as featured
    } catch (error) {
      console.error('Error loading featured cards:', error);
      return [];
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ slug });
      
      if (response.data.length > 0) {
        return response.data[0];
      }
      
      // If slug search fails, try to find by ID
      const allCardsResponse = await this.fetchCards({});
      const card = allCardsResponse.data.find(c => c.slug === slug || c.id === slug);
      
      return card || null;
    } catch (error) {
      console.error('Error loading card details:', error);
      return null;
    }
  }
}

export const cardService = new CardService();
