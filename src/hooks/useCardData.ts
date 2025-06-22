
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
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching for cards:', { query, selectedTags, selectedBankIds, freeCards });
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
      console.log('All cards loaded:', allCards);
      setCards(allCards);
      setInitialized(true);
    } catch (err) {
      console.error('Error loading all cards:', err);
      setError('Unable to load cards. Please check your connection and try again.');
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
    loadAllCards
  };
};
