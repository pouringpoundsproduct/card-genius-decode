
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
      console.log('Raw banks/tags API response:', result);
      
      if (result.success && result.data) {
        banksCache = result.data.banks || [];
        tagsCache = result.data.tags || [];
        cacheInitialized = true;
        console.log('Banks and tags cached:', { banks: banksCache.length, tags: tagsCache.length });
      } else {
        console.warn('No data in banks/tags response, using fallbacks');
        banksCache = [];
        tagsCache = [];
      }

      return { banks: banksCache, tags: tagsCache };
    } catch (error) {
      console.error('Error fetching banks and tags:', error);
      // Provide fallback data
      banksCache = [
        { id: '1', name: 'HDFC Bank' },
        { id: '2', name: 'SBI' },
        { id: '3', name: 'ICICI Bank' },
        { id: '4', name: 'Axis Bank' },
        { id: '5', name: 'Kotak Mahindra Bank' }
      ];
      tagsCache = [
        { id: '1', name: 'Fuel', slug: 'fuel' },
        { id: '2', name: 'Shopping', slug: 'shopping' },
        { id: '3', name: 'Airport Lounge', slug: 'airport-lounge' },
        { id: '4', name: 'Cashback', slug: 'cashback' },
        { id: '5', name: 'Travel', slug: 'travel' }
      ];
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
        page: params.page || 1,
        limit: params.limit || 20,
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
      console.log('Raw cards API response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const cards = result.data.map((card: any) => this.transformCard(card));
        console.log('Transformed cards:', cards.length);
        
        return {
          data: cards,
          total: result.total_records || result.data.length,
          page: result.current_page || params.page || 1,
          limit: result.per_page || params.limit || 20,
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
    const bankInfo = banksCache.find(bank => bank.id === apiCard.bank_id);
    
    return {
      id: apiCard.id || apiCard.card_id || Math.random().toString(),
      name: apiCard.name || apiCard.card_name || 'Unknown Card',
      nick_name: apiCard.nick_name || '',
      slug: apiCard.slug || apiCard.id || Math.random().toString(),
      image: apiCard.image || apiCard.card_image || '',
      bank_name: bankInfo?.name || apiCard.bank_name || 'Unknown Bank',
      bank_id: apiCard.bank_id || '',
      joining_fee: apiCard.joining_fee || 0,
      annual_fee: apiCard.annual_fee || 0,
      welcome_offer: apiCard.welcome_offer || apiCard.welcome_bonus || '',
      features: Array.isArray(apiCard.features) ? apiCard.features : 
                Array.isArray(apiCard.benefits) ? apiCard.benefits : [],
      tags: Array.isArray(apiCard.tags) ? apiCard.tags : [],
      cashback_rate: apiCard.cashback_rate || '',
      reward_rate: apiCard.reward_rate || apiCard.rewards || '',
      eligibility: Array.isArray(apiCard.eligibility) ? apiCard.eligibility : 
                   Array.isArray(apiCard.eligibility_criteria) ? apiCard.eligibility_criteria : [],
      other_info: Array.isArray(apiCard.other_info) ? apiCard.other_info : 
                  Array.isArray(apiCard.additional_info) ? apiCard.additional_info : [],
      lounge_access: apiCard.lounge_access || apiCard.airport_lounge || false,
      apply_url: apiCard.apply_url || apiCard.application_url || '',
      relevanceScore: 0
    };
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
        page,
        limit,
        banks_ids: selectedBankIds,
        free_cards: freeCards ? "true" : "",
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

      console.log('Search results:', cards.length, 'cards found');
      return cards;
    } catch (error) {
      console.error('Error in searchCards:', error);
      throw error;
    }
  }

  async getAllCards(page: number = 1, limit: number = 20): Promise<{cards: CreditCard[], hasMore: boolean, total: number}> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ page, limit });
      return {
        cards: response.data,
        hasMore: response.hasMore,
        total: response.total
      };
    } catch (error) {
      console.error('Error loading all cards:', error);
      throw error;
    }
  }

  async getFeaturedCards(): Promise<CreditCard[]> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ limit: 6, sort_by: 'featured' });
      return response.data;
    } catch (error) {
      console.error('Error loading featured cards:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      await this.fetchBanksAndTags();
      const response = await this.fetchCards({ slug });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error loading card details:', error);
      return null;
    }
  }
}

export const cardService = new CardService();
