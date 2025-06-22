
import React from 'react';
import { Filter } from 'lucide-react';
import { TagFilters } from './TagFilters';
import { BankSelector } from './BankSelector';

interface SearchFiltersProps {
  showFilters: boolean;
  hasActiveFilters: boolean;
  showFreeCards: boolean;
  selectedTags: string[];
  selectedBankIds: string[];
  tags: any[];
  banks: any[];
  onClearFilters: () => void;
  onFreeCardsToggle: () => void;
  onTagSelect: (tagSlug: string) => void;
  onBankSelect: (bankId: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  showFilters,
  hasActiveFilters,
  showFreeCards,
  selectedTags,
  selectedBankIds,
  tags,
  banks,
  onClearFilters,
  onFreeCardsToggle,
  onTagSelect,
  onBankSelect
}) => {
  return (
    <div className={`lg:hidden transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-400" />
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        
        {/* Free Cards Toggle */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Card Type</h4>
          <button
            onClick={onFreeCardsToggle}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
              showFreeCards
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            {showFreeCards ? '✓ ' : ''}Free Cards Only
          </button>
        </div>
        
        {/* Categories */}
        {tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Categories</h4>
            <TagFilters 
              selectedTags={selectedTags}
              onTagSelect={onTagSelect}
              availableTags={tags}
            />
          </div>
        )}
        
        {/* Banks */}
        {banks.length > 0 && (
          <BankSelector
            selectedBankIds={selectedBankIds}
            onBankSelect={onBankSelect}
            availableBanks={banks}
          />
        )}
      </div>
    </div>
  );
};
