
import Fuse from 'fuse.js';
import { CreditCard } from '../types/card';

const API_BASE = 'https://bk-api.bankkaro.com/sp/api';

// Cache for banks data
let banksCache: any[] = [];
let tagsCache: any[] = [];

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
  data: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class CardService {
  private async fetchBanksAndTags() {
    try {
      const response = await fetch(`${API_BASE}/bank-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: ''
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        banksCache = result.data.banks || [];
        tagsCache = result.data.tags || [];
        console.log('Banks and tags loaded:', { banks: banksCache.length, tags: tagsCache.length });
      }

      return { banks: banksCache, tags: tagsCache };
    } catch (error) {
      console.error('Error fetching banks and tags:', error);
      return { banks: [], tags: [] };
    }
  }

  private async fetchCards(params: CardSearchParams = {}): Promise<ApiResponse> {
    try {
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
      console.log('Cards API response:', result);

      if (result.success && result.data) {
        const cards = result.data.map((card: any) => this.transformCard(card));
        return {
          data: cards,
          total: result.total_records || result.data.length,
          page: result.current_page || 1,
          limit: result.per_page || 20,
          hasMore: result.has_more_pages || false
        };
      }

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
      id: apiCard.id || apiCard.card_id,
      name: apiCard.name || apiCard.card_name,
      nick_name: apiCard.nick_name,
      slug: apiCard.slug,
      image: apiCard.image || apiCard.card_image,
      bank_name: bankInfo?.name || apiCard.bank_name || 'Unknown Bank',
      bank_id: apiCard.bank_id,
      joining_fee: apiCard.joining_fee || 0,
      annual_fee: apiCard.annual_fee || 0,
      welcome_offer: apiCard.welcome_offer || apiCard.welcome_bonus,
      features: Array.isArray(apiCard.features) ? apiCard.features : 
                Array.isArray(apiCard.benefits) ? apiCard.benefits : [],
      tags: Array.isArray(apiCard.tags) ? apiCard.tags : [],
      cashback_rate: apiCard.cashback_rate,
      reward_rate: apiCard.reward_rate || apiCard.rewards,
      eligibility: Array.isArray(apiCard.eligibility) ? apiCard.eligibility : 
                   Array.isArray(apiCard.eligibility_criteria) ? apiCard.eligibility_criteria : [],
      other_info: Array.isArray(apiCard.other_info) ? apiCard.other_info : 
                  Array.isArray(apiCard.additional_info) ? apiCard.additional_info : [],
      lounge_access: apiCard.lounge_access || apiCard.airport_lounge,
      apply_url: apiCard.apply_url || apiCard.application_url,
      relevanceScore: 0
    };
  }

  async getBanksAndTags() {
    if (banksCache.length === 0 || tagsCache.length === 0) {
      await this.fetchBanksAndTags();
    }
    return { banks: banksCache, tags: tagsCache };
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
      const params: CardSearchParams = {
        page,
        limit,
        banks_ids: selectedBankIds,
        free_cards: freeCards ? "true" : "",
      };

      const response = await this.fetchCards(params);
      let cards = response.data;

      // Apply tag filtering on client side if needed
      if (selectedTags.length > 0) {
        cards = cards.filter(card => 
          card.tags && card.tags.some((tag: any) => {
            const tagSlug = typeof tag === 'string' ? tag : tag.slug || tag.name;
            return selectedTags.includes(tagSlug);
          })
        );
      }

      // Apply search query filtering
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

      return cards;
    } catch (error) {
      console.error('Error in searchCards:', error);
      throw error;
    }
  }

  async getAllCards(page: number = 1, limit: number = 20): Promise<{cards: CreditCard[], hasMore: boolean, total: number}> {
    try {
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
      const response = await this.fetchCards({ limit: 6, sort_by: 'featured' });
      return response.data;
    } catch (error) {
      console.error('Error loading featured cards:', error);
      return [];
    }
  }

  async getCardDetails(slug: string): Promise<CreditCard | null> {
    try {
      const response = await this.fetchCards({ slug });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error loading card details:', error);
      return null;
    }
  }
}

export const cardService = new CardService();
