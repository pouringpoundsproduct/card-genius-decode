
import React from 'react';
import { SearchHeader } from '../components/SearchHeader';
import { SearchContent } from '../components/SearchContent';
import { useSearchState } from '../hooks/useSearchState';
import { useSearchParams } from '../hooks/useSearchParams';

const Search = () => {
  const searchState = useSearchState();
  const {
    searchQuery,
    selectedTags,
    selectedBankIds,
    showFreeCards,
    showFilters,
    hasActiveFilters,
    cards,
    loading,
    error,
    banks,
    tags,
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
    clearFilters
  } = searchState;

  // Handle URL parameters
  useSearchParams({
    searchQuery,
    selectedTags,
    selectedBankIds,
    showFreeCards,
    setSearchQuery,
    setSelectedTags,
    setSelectedBankIds,
    setShowFreeCards,
    onSearch: async (query, tags, bankIds, freeCards) => {
      // This will be called with initial URL parameters
      await searchState.searchCards?.(query, tags, bankIds, freeCards);
    }
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SearchHeader
        hasActiveFilters={hasActiveFilters}
        selectedTags={selectedTags}
        selectedBankIds={selectedBankIds}
        showFreeCards={showFreeCards}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      <SearchContent
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        selectedBankIds={selectedBankIds}
        showFreeCards={showFreeCards}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        cards={cards}
        loading={loading}
        error={error}
        banks={banks}
        tags={tags}
        onSearch={handleSearch}
        onTagSelect={handleTagSelect}
        onBankSelect={handleBankSelect}
        onFreeCardsToggle={handleFreeCardsToggle}
        onQuickFilter={handleQuickFilter}
        onClearFilters={clearFilters}
      />
    </div>
  );
};

export default Search;
