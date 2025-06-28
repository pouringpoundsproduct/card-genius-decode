import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { CardGrid } from './CardGrid';
import { SearchFilters } from './SearchFilters';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchFilterSidebar } from './SearchFilterSidebar';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { QuickFilters } from './QuickFilters';

interface SearchContentProps {
  // State
  searchQuery: string;
  selectedTags: string[];
  selectedBankIds: string[];
  showFreeCards: boolean;
  showFilters: boolean;
  hasActiveFilters: boolean;
  // Data
  cards: any[];
  loading: boolean;
  error: string | null;
  banks: any[];
  tags: any[];
  // Handlers
  onSearch: (query: string) => void;
  onTagSelect: (tagSlug: string) => void;
  onBankSelect: (bankId: string) => void;
  onFreeCardsToggle: () => void;
  onQuickFilter: (filterType: string, value?: any) => void;
  onClearFilters: () => void;
}

export const SearchContent: React.FC<SearchContentProps> = ({
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
  onSearch,
  onTagSelect,
  onBankSelect,
  onFreeCardsToggle,
  onQuickFilter,
  onClearFilters
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Search Section */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto mb-6">
          <SearchBar 
            value={searchQuery}
            onChange={onSearch}
            placeholder="Search credit cards, banks, or features..."
            debounceMs={500}
          />
        </div>

        {/* Quick Filters */}
        <QuickFilters
          showFreeCards={showFreeCards}
          selectedBankIds={selectedBankIds}
          selectedTags={selectedTags}
          banks={banks}
          tags={tags}
          onQuickFilter={onQuickFilter}
        />
        
        {/* Mobile Filters */}
        <SearchFilters
          showFilters={showFilters}
          hasActiveFilters={hasActiveFilters}
          showFreeCards={showFreeCards}
          selectedTags={selectedTags}
          selectedBankIds={selectedBankIds}
          tags={tags}
          banks={banks}
          onClearFilters={onClearFilters}
          onFreeCardsToggle={onFreeCardsToggle}
          onTagSelect={onTagSelect}
          onBankSelect={onBankSelect}
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <SearchFilterSidebar
          hasActiveFilters={hasActiveFilters}
          showFreeCards={showFreeCards}
          selectedTags={selectedTags}
          selectedBankIds={selectedBankIds}
          tags={tags}
          banks={banks}
          onClearFilters={onClearFilters}
          onFreeCardsToggle={onFreeCardsToggle}
          onTagSelect={onTagSelect}
          onBankSelect={onBankSelect}
        />

        {/* Results Section */}
        <div className="lg:col-span-3">
          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <h3 className="text-red-400 font-semibold">Search Error</h3>
              </div>
              <p className="text-gray-300">{error}</p>
            </div>
          )}

          {/* Results Header */}
          <SearchResultsHeader
            hasActiveFilters={hasActiveFilters}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            selectedBankIds={selectedBankIds}
            showFreeCards={showFreeCards}
            cardsCount={cards.length}
            loading={loading}
          />

          {/* Active Filters Display */}
          <ActiveFiltersDisplay
            hasActiveFilters={hasActiveFilters}
            showFreeCards={showFreeCards}
            selectedBankIds={selectedBankIds}
            selectedTags={selectedTags}
            banks={banks}
            tags={tags}
            onFreeCardsToggle={onFreeCardsToggle}
            onBankSelect={onBankSelect}
            onTagSelect={onTagSelect}
          />

          {/* Cards Grid */}
          <CardGrid cards={cards} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
};
