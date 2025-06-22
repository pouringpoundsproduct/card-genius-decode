
import { useState, useEffect } from 'react';
import { useCardData } from './useCardData';

export const useSearchState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [showFreeCards, setShowFreeCards] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { cards, loading, error, banks, tags, searchCards, loadBanksAndTags } = useCardData();

  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing search page...');
      await loadBanksAndTags();
      await searchCards(searchQuery, selectedTags, selectedBankIds, showFreeCards);
    };
    
    initializeData();
  }, [loadBanksAndTags]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await searchCards(query, selectedTags, selectedBankIds, showFreeCards);
  };

  const handleTagSelect = async (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug) 
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug];
    
    setSelectedTags(newTags);
    await searchCards(searchQuery, newTags, selectedBankIds, showFreeCards);
  };

  const handleBankSelect = async (bankId: string) => {
    const newBankIds = selectedBankIds.includes(bankId)
      ? selectedBankIds.filter(id => id !== bankId)
      : [...selectedBankIds, bankId];
    
    setSelectedBankIds(newBankIds);
    await searchCards(searchQuery, selectedTags, newBankIds, showFreeCards);
  };

  const handleFreeCardsToggle = async () => {
    const newShowFreeCards = !showFreeCards;
    setShowFreeCards(newShowFreeCards);
    await searchCards(searchQuery, selectedTags, selectedBankIds, newShowFreeCards);
  };

  const handleQuickFilter = async (filterType: string, value: any) => {
    switch (filterType) {
      case 'ltf':
        await handleFreeCardsToggle();
        break;
      case 'bank':
        await handleBankSelect(value);
        break;
      case 'category':
        await handleTagSelect(value);
        break;
      default:
        break;
    }
  };

  const clearFilters = async () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedBankIds([]);
    setShowFreeCards(false);
    await searchCards('', [], [], false);
  };

  const hasActiveFilters = !!(searchQuery || selectedTags.length > 0 || selectedBankIds.length > 0 || showFreeCards);

  return {
    // State
    searchQuery,
    selectedTags,
    selectedBankIds,
    showFreeCards,
    showFilters,
    hasActiveFilters,
    // Data
    cards,
    loading,
    error,
    banks,
    tags,
    // Actions
    setSearchQuery,
    setSelectedTags,
    setSelectedBankIds,
    setShowFreeCards,
    setShowFilters,
    handleSearch,
    handleTagSelect,
    handleBankSelect,
    handleFreeCardsToggle,
    handleQuickFilter,
    clearFilters,
    searchCards // Add this to the return object
  };
};
