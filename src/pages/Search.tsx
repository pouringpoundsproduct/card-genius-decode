import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { TagFilters } from '../components/TagFilters';
import { useCardData } from '../hooks/useCardData';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [selectedBank, setSelectedBank] = useState(searchParams.get('bank') || '');
  const [showFilters, setShowFilters] = useState(false);
  
  const { cards, loading, error, banks, tags, searchCards, loadBanksAndTags } = useCardData();

  useEffect(() => {
    // Load banks and tags first, then search
    const initializeData = async () => {
      await loadBanksAndTags();
      const bankIds = selectedBank ? [selectedBank] : [];
      searchCards(searchQuery, selectedTags, bankIds, false);
    };
    
    initializeData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateURL(query, selectedTags, selectedBank);
    const bankIds = selectedBank ? [selectedBank] : [];
    searchCards(query, selectedTags, bankIds, false);
  };

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateURL(searchQuery, newTags, selectedBank);
    const bankIds = selectedBank ? [selectedBank] : [];
    searchCards(searchQuery, newTags, bankIds, false);
  };

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    updateURL(searchQuery, selectedTags, bank);
    const bankIds = bank ? [bank] : [];
    searchCards(searchQuery, selectedTags, bankIds, false);
  };

  const updateURL = (query: string, tagsList: string[], bank: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tagsList.length > 0) params.set('tags', tagsList.join(','));
    if (bank) params.set('bank', bank);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedBank('');
    setSearchParams({});
    searchCards('', [], [], false);
  };

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
            />
          </div>
          
          {/* Mobile Filters */}
          <div className={`lg:hidden transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                {(searchQuery || selectedTags.length > 0 || selectedBank) && (
                  <button
                    onClick={clearFilters}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <TagFilters 
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
                availableTags={tags}
              />
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
                  {(searchQuery || selectedTags.length > 0 || selectedBank) && (
                    <button
                      onClick={clearFilters}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                {/* Tag Filters */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Categories</h4>
                  <TagFilters 
                    selectedTags={selectedTags}
                    onTagSelect={handleTagSelect}
                    availableTags={tags}
                  />
                </div>

                {/* Bank Filters */}
                {banks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-4">Banks</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => handleBankSelect('')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !selectedBank
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        All Banks
                      </button>
                      {banks.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => handleBankSelect(bank.name)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedBank === bank.name
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'text-gray-300 hover:bg-gray-800/50'
                          }`}
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {searchQuery || selectedTags.length > 0 || selectedBank ? 'Search Results' : 'All Credit Cards'}
                </h2>
                {(searchQuery || selectedTags.length > 0 || selectedBank) && (
                  <p className="text-gray-400 mt-1">
                    {searchQuery && `for "${searchQuery}"`}
                    {searchQuery && (selectedTags.length > 0 || selectedBank) && ' • '}
                    {selectedBank && `${selectedBank}`}
                    {selectedBank && selectedTags.length > 0 && ' • '}
                    {selectedTags.length > 0 && `${selectedTags.length} filters applied`}
                  </p>
                )}
              </div>
              {cards.length > 0 && !loading && (
                <p className="text-gray-400">{cards.length} cards found</p>
              )}
            </div>

            {/* Active Filters Display */}
            {(selectedTags.length > 0 || selectedBank) && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBank && (
                    <button
                      onClick={() => handleBankSelect('')}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-500/30 transition-colors"
                    >
                      {selectedBank}
                      <span className="text-purple-300">×</span>
                    </button>
                  )}
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-500/30 transition-colors"
                    >
                      {tag.replace('-', ' ').toUpperCase()}
                      <span className="text-purple-300">×</span>
                    </button>
                  ))}
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
