import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { SearchFilters } from '../components/SearchFilters';
import { SearchResultsHeader } from '../components/SearchResultsHeader';
import { SearchFilterSidebar } from '../components/SearchFilterSidebar';
import { ActiveFiltersDisplay } from '../components/ActiveFiltersDisplay';
import { QuickFilters } from '../components/QuickFilters';
import { useCardData } from '../hooks/useCardData';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(
    searchParams.get('banks')?.split(',').filter(Boolean) || []
  );
  const [showFreeCards, setShowFreeCards] = useState<boolean>(
    searchParams.get('free') === 'true'
  );
  const [showFilters, setShowFilters] = useState(false);
  
  const { cards, loading, error, banks, tags, searchCards, loadBanksAndTags } = useCardData();

  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing search page...');
      await loadBanksAndTags();
      // Perform initial search with URL parameters
      await searchCards(searchQuery, selectedTags, selectedBankIds, showFreeCards);
    };
    
    initializeData();
  }, [loadBanksAndTags]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    updateURL(query, selectedTags, selectedBankIds, showFreeCards);
    await searchCards(query, selectedTags, selectedBankIds, showFreeCards);
  };

  const handleTagSelect = async (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug) 
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug];
    
    setSelectedTags(newTags);
    updateURL(searchQuery, newTags, selectedBankIds, showFreeCards);
    await searchCards(searchQuery, newTags, selectedBankIds, showFreeCards);
  };

  const handleBankSelect = async (bankId: string) => {
    const newBankIds = selectedBankIds.includes(bankId)
      ? selectedBankIds.filter(id => id !== bankId)
      : [...selectedBankIds, bankId];
    
    setSelectedBankIds(newBankIds);
    updateURL(searchQuery, selectedTags, newBankIds, showFreeCards);
    await searchCards(searchQuery, selectedTags, newBankIds, showFreeCards);
  };

  const handleFreeCardsToggle = async () => {
    const newShowFreeCards = !showFreeCards;
    setShowFreeCards(newShowFreeCards);
    updateURL(searchQuery, selectedTags, selectedBankIds, newShowFreeCards);
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

  const updateURL = (query: string, tagsList: string[], bankIds: string[], freeCards: boolean) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tagsList.length > 0) params.set('tags', tagsList.join(','));
    if (bankIds.length > 0) params.set('banks', bankIds.join(','));
    if (freeCards) params.set('free', 'true');
    setSearchParams(params);
  };

  const clearFilters = async () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedBankIds([]);
    setShowFreeCards(false);
    setSearchParams({});
    await searchCards('', [], [], false);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedBankIds.length > 0 || showFreeCards;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(selectedTags.length + selectedBankIds.length + (showFreeCards ? 1 : 0))}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar 
              value={searchQuery}
              onChange={handleSearch}
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
            onQuickFilter={handleQuickFilter}
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
            onClearFilters={clearFilters}
            onFreeCardsToggle={handleFreeCardsToggle}
            onTagSelect={handleTagSelect}
            onBankSelect={handleBankSelect}
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
            onClearFilters={clearFilters}
            onFreeCardsToggle={handleFreeCardsToggle}
            onTagSelect={handleTagSelect}
            onBankSelect={handleBankSelect}
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
              onFreeCardsToggle={handleFreeCardsToggle}
              onBankSelect={handleBankSelect}
              onTagSelect={handleTagSelect}
            />

            {/* Cards Grid */}
            <CardGrid cards={cards} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
