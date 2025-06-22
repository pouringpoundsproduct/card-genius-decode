
import React from 'react';

interface SearchResultsHeaderProps {
  hasActiveFilters: boolean;
  searchQuery: string;
  selectedTags: string[];
  selectedBankIds: string[];
  showFreeCards: boolean;
  cardsCount: number;
  loading: boolean;
}

export const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  hasActiveFilters,
  searchQuery,
  selectedTags,
  selectedBankIds,
  showFreeCards,
  cardsCount,
  loading
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {hasActiveFilters ? 'Search Results' : 'All Credit Cards'}
        </h2>
        {hasActiveFilters && (
          <p className="text-gray-400 mt-1">
            {searchQuery && `"${searchQuery}"`}
            {searchQuery && (selectedTags.length > 0 || selectedBankIds.length > 0 || showFreeCards) && ' • '}
            {selectedBankIds.length > 0 && `${selectedBankIds.length} banks`}
            {selectedBankIds.length > 0 && (selectedTags.length > 0 || showFreeCards) && ' • '}
            {selectedTags.length > 0 && `${selectedTags.length} categories`}
            {selectedTags.length > 0 && showFreeCards && ' • '}
            {showFreeCards && 'Free cards only'}
          </p>
        )}
      </div>
      {cardsCount > 0 && !loading && (
        <p className="text-gray-400">{cardsCount} cards found</p>
      )}
    </div>
  );
};
