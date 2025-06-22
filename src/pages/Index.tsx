import React, { useState, useEffect } from 'react';
import { Search, Filter, CreditCard, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { TagFilters } from '../components/TagFilters';
import { FeaturedCards } from '../components/FeaturedCards';
import { useCardData } from '../hooks/useCardData';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [showFreeCards, setShowFreeCards] = useState(false);
  const { cards, loading, error, banks, tags, initialized, searchCards, loadBanksAndTags, loadAllCards } = useCardData();

  useEffect(() => {
    // Load initial data
    const initializeData = async () => {
      console.log('Initializing data...');
      await loadBanksAndTags();
      await loadAllCards();
    };
    
    initializeData();
  }, [loadBanksAndTags, loadAllCards]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchCards(query, selectedTags, selectedBankIds, showFreeCards);
  };

  const handleTagSelect = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug) 
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug];
    
    setSelectedTags(newTags);
    searchCards(searchQuery, newTags, selectedBankIds, showFreeCards);
  };

  const handleBankSelect = (bankId: string) => {
    const newBankIds = selectedBankIds.includes(bankId)
      ? selectedBankIds.filter(id => id !== bankId)
      : [...selectedBankIds, bankId];
    
    setSelectedBankIds(newBankIds);
    searchCards(searchQuery, selectedTags, newBankIds, showFreeCards);
  };

  const handleFreeCardsToggle = () => {
    const newShowFreeCards = !showFreeCards;
    setShowFreeCards(newShowFreeCards);
    searchCards(searchQuery, selectedTags, selectedBankIds, newShowFreeCards);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedBankIds.length > 0 || showFreeCards;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-gray-900/40"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <CreditCard className="h-8 w-8 text-purple-400 mr-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              CREDIT+
            </h1>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Decode your
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              credit card
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            You pay the fee. We'll find the perks. Discover all benefits, offers, and features 
            of India's premium credit cards.
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar 
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search credit cards or banks..."
            />
          </div>
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* Tag Filters */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Filter className="h-5 w-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-200">Quick Filters</h3>
          </div>
          <TagFilters 
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            availableTags={tags}
          />
        </div>
      </section>

      {/* Advanced Filters */}
      {hasActiveFilters && (
        <section className="px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* Free Cards Toggle */}
              <button
                onClick={handleFreeCardsToggle}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  showFreeCards
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
              >
                Free Cards Only
              </button>

              {/* Bank Filters */}
              {banks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400 text-sm mr-2">Banks:</span>
                  {banks.slice(0, 6).map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleBankSelect(bank.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedBankIds.includes(bank.id)
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50'
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Load Cards</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => loadAllCards()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Cards Display */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {hasActiveFilters ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">
                  Search Results
                  <span className="text-gray-400 font-normal text-lg ml-2">
                    {searchQuery && `for "${searchQuery}"`}
                    {selectedBankIds.length > 0 && ` • ${selectedBankIds.length} banks`}
                    {selectedTags.length > 0 && ` • ${selectedTags.length} categories`}
                    {showFreeCards && ` • Free cards only`}
                  </span>
                </h3>
                {cards.length > 0 && (
                  <p className="text-gray-400">{cards.length} cards found</p>
                )}
              </div>
              <CardGrid cards={cards} loading={loading} error={error} />
            </div>
          ) : (
            <FeaturedCards cards={cards} loading={loading} />
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/20">
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Your card deserves a spotlight</h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of smart spenders who've unlocked their card's true potential. 
              Every benefit. Every offer. Every reward.
            </p>
            <Link
              to="/search"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
            >
              Explore All Cards
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
