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

  const loadBanksAndTags = useCallback(async () => {
    try {
      console.log('Loading banks and tags...');
      const { banks: banksList, tags: tagsList } = await cardService.getBanksAndTags();
      console.log('Loaded banks:', banksList);
      console.log('Loaded tags:', tagsList);
      setBanks(banksList);
      setTags(tagsList);
    } catch (err) {
      console.error('Error loading banks and tags:', err);
      // Fallback data is handled in the service
    }
  }, []);

  const loadAllCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading all cards...');
      const allCards = await cardService.getAllCards();
      console.log('All cards loaded:', allCards.length, 'cards');
      setCards(allCards);
      setInitialized(true);
    } catch (err) {
      console.error('Error loading all cards:', err);
      setError('Unable to load cards. Please check your connection and try again.');
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
      setCards(featuredCards);
      setInitialized(true);
    } catch (err) {
      console.error('Error loading featured cards:', err);
      setError('Unable to load featured cards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      // For local search, we need to ensure all cards are loaded first
      if (!initialized) {
        console.log('Initializing with all cards for local search...');
        await loadAllCards();
      }
      
      const result = await cardService.searchCards(query, selectedTags, selectedBankIds, freeCards);
      console.log('Search results:', result);
      setCards(result);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards. Please try again.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [initialized, loadAllCards]);

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
