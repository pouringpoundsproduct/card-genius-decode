
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { TagFilters } from '../components/TagFilters';
import { BankSelector } from '../components/BankSelector';
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
  const [showFreeCards, setShowFreeCards] = useState(searchParams.get('free') === 'true');
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
          
          {/* Mobile Filters */}
          <div className={`lg:hidden transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-400" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
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
                  onClick={handleFreeCardsToggle}
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
                    onTagSelect={handleTagSelect}
                    availableTags={tags}
                  />
                </div>
              )}
              
              {/* Banks */}
              {banks.length > 0 && (
                <BankSelector
                  selectedBankIds={selectedBankIds}
                  onBankSelect={handleBankSelect}
                  availableBanks={banks}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5 text-purple-400" />
                    Filters
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                {/* Free Cards Toggle */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Card Type</h4>
                  <button
                    onClick={handleFreeCardsToggle}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                      showFreeCards
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50'
                    }`}
                  >
                    {showFreeCards ? '✓ ' : ''}Free Cards Only
                  </button>
                </div>
                
                {/* Tag Filters */}
                {tags.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-300 mb-4">Categories</h4>
                    <TagFilters 
                      selectedTags={selectedTags}
                      onTagSelect={handleTagSelect}
                      availableTags={tags}
                    />
                  </div>
                )}

                {/* Bank Filters */}
                {banks.length > 0 && (
                  <BankSelector
                    selectedBankIds={selectedBankIds}
                    onBankSelect={handleBankSelect}
                    availableBanks={banks}
                  />
                )}
              </div>
            </div>
          </div>

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
              {cards.length > 0 && !loading && (
                <p className="text-gray-400">{cards.length} cards found</p>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {showFreeCards && (
                    <button
                      onClick={handleFreeCardsToggle}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-medium hover:bg-green-500/30 transition-colors"
                    >
                      Free Cards
                      <span className="text-green-300">×</span>
                    </button>
                  )}
                  {selectedBankIds.map((bankId) => {
                    const bank = banks.find(b => b.id === bankId);
                    return bank ? (
                      <button
                        key={bankId}
                        onClick={() => handleBankSelect(bankId)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium hover:bg-blue-500/30 transition-colors"
                      >
                        {bank.name}
                        <span className="text-blue-300">×</span>
                      </button>
                    ) : null;
                  })}
                  {selectedTags.map((tag) => {
                    const tagData = tags.find(t => (t.slug || t.id) === tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagSelect(tag)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        {tagData?.name || tag.replace('-', ' ').toUpperCase()}
                        <span className="text-purple-300">×</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cards Grid */}
            <CardGrid cards={cards} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
