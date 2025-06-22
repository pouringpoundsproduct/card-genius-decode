
import { useState, useCallback } from 'react';
import { CreditCard } from '../types/card';
import { cardService } from '../services/cardService';

export const useCardData = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  const searchCards = useCallback(async (
    query: string = '', 
    selectedTags: string[] = [], 
    selectedBankIds: string[] = [],
    freeCards: boolean = false
  ) => {
    console.log('searchCards called with:', { query, selectedTags, selectedBankIds, freeCards });
    setLoading(true);
    setError(null);
    
    try {
      const result = await cardService.searchCards(query, selectedTags, selectedBankIds, freeCards);
      console.log('Search results:', result);
      setCards(Array.isArray(result) ? result : []);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards. Please try again.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCardDetails = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const card = await cardService.getCardDetails(slug);
      return card;
    } catch (err) {
      console.error('Error fetching card details:', err);
      setError('Failed to load card details. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBanksAndTags = useCallback(async () => {
    try {
      console.log('Loading banks and tags...');
      const { banks: banksList, tags: tagsList } = await cardService.getBanksAndTags();
      console.log('Loaded banks:', banksList);
      console.log('Loaded tags:', tagsList);
      setBanks(Array.isArray(banksList) ? banksList : []);
      setTags(Array.isArray(tagsList) ? tagsList : []);
    } catch (err) {
      console.error('Error loading banks and tags:', err);
      setBanks([]);
      setTags([]);
    }
  }, []);

  const loadAllCards = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading all cards...', { page, limit });
      const result = await cardService.getAllCards(page, limit);
      console.log('All cards loaded:', result.cards.length, 'cards');
      setCards(Array.isArray(result.cards) ? result.cards : []);
      setInitialized(true);
      return {
        cards: result.cards,
        hasMore: result.hasMore,
        total: result.total
      };
    } catch (err) {
      console.error('Error loading all cards:', err);
      setError('Unable to load cards. Please check your connection and try again.');
      return { cards: [], hasMore: false, total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeaturedCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading featured cards...');
      const featuredCards = await cardService.getFeaturedCards();
      console.log('Featured cards loaded:', featuredCards.length, 'cards');
      setCards(Array.isArray(featuredCards) ? featuredCards : []);
      setInitialized(true);
    } catch (err) {
      console.error('Error loading featured cards:', err);
      setError('Unable to load featured cards. Please try again.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cards,
    loading,
    error,
    banks,
    tags,
    initialized,
    searchCards,
    getCardDetails,
    loadBanksAndTags,
    loadAllCards,
    loadFeaturedCards
  };
};
