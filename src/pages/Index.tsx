import React, { useState, useEffect } from 'react';
import { Search, Filter, CreditCard, ArrowRight, Sparkles, AlertCircle, BarChart3, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { TagFilters } from '../components/TagFilters';
import { FeaturedCards } from '../components/FeaturedCards';
import { BankSelector } from '../components/BankSelector';
import { ComparisonModal } from '../components/ComparisonModal';
import { useCardData } from '../hooks/useCardData';
import { useComparison } from '../contexts/ComparisonContext';

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [showFreeCards, setShowFreeCards] = useState(false);
  const [showAllCards, setShowAllCards] = useState(true);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const { cards, loading, error, banks, tags, initialized, searchCards, loadBanksAndTags, loadAllCards, loadFeaturedCards } = useCardData();
  const { comparisonCards } = useComparison();

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Initializing home page data...');
        await loadBanksAndTags();
        await loadAllCards();
      } catch (err) {
        console.error('Error initializing:', err);
      }
    };
    
    initializeData();
  }, [loadBanksAndTags, loadAllCards]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchCards(query, selectedTags, selectedBankIds, showFreeCards);
    } else {
      // Reset to all cards when search is cleared
      await loadAllCards();
    }
  };

  const handleAIAssistantClick = () => {
    navigate('/ai-assistant');
  };

  const handleTagSelect = async (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug) 
      ? selectedTags.filter(t => t !== tagSlug)
      : [...selectedTags, tagSlug];
    
    setSelectedTags(newTags);
    if (searchQuery.trim() || newTags.length > 0 || selectedBankIds.length > 0 || showFreeCards) {
      await searchCards(searchQuery, newTags, selectedBankIds, showFreeCards);
    } else {
      await loadAllCards();
    }
  };

  const handleBankSelect = async (bankId: string) => {
    const newBankIds = selectedBankIds.includes(bankId)
      ? selectedBankIds.filter(id => id !== bankId)
      : [...selectedBankIds, bankId];
    
    setSelectedBankIds(newBankIds);
    if (searchQuery.trim() || selectedTags.length > 0 || newBankIds.length > 0 || showFreeCards) {
      await searchCards(searchQuery, selectedTags, newBankIds, showFreeCards);
    } else {
      await loadAllCards();
    }
  };

  const handleFreeCardsToggle = async () => {
    const newShowFreeCards = !showFreeCards;
    setShowFreeCards(newShowFreeCards);
    if (searchQuery.trim() || selectedTags.length > 0 || selectedBankIds.length > 0 || newShowFreeCards) {
      await searchCards(searchQuery, selectedTags, selectedBankIds, newShowFreeCards);
    } else {
      await loadAllCards();
    }
  };

  const handleShowAllToggle = () => {
    setShowAllCards(!showAllCards);
  };

  const handleClearFilters = async () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedBankIds([]);
    setShowFreeCards(false);
    await loadAllCards();
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedBankIds.length > 0 || showFreeCards;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Comparison Button - Fixed */}
      {comparisonCards.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowComparisonModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            Compare ({comparisonCards.length})
          </button>
        </div>
      )}

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
              debounceMs={500}
            />
            
            {/* AI Assistant Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAIAssistantClick}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MessageCircle className="h-5 w-5" />
                Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* Error State */}
      {error && !loading && (
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Load Cards</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && !error && (
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading credit cards...</p>
            </div>
          </div>
        </section>
      )}

      {/* Content when data is loaded */}
      {!loading && !error && (
        <>
          {/* Quick Filters Section */}
          {tags.length > 0 && (
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
          )}

          {/* Advanced Filters */}
          {hasActiveFilters && (
            <section className="px-6 py-4">
              <div className="max-w-7xl mx-auto">
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {/* Free Cards Toggle */}
                    <button
                      onClick={handleFreeCardsToggle}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        showFreeCards
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50'
                      }`}
                    >
                      {showFreeCards ? '✓ ' : ''}Free Cards Only
                    </button>

                    {/* Bank Filters */}
                    {banks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-gray-400 text-sm mr-2">Banks:</span>
                        {banks.slice(0, 6).map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => handleBankSelect(bank.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                              selectedBankIds.includes(bank.id)
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50'
                            }`}
                          >
                            {bank.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Show more banks option */}
                  {banks.length > 6 && (
                    <div className="mt-4">
                      <BankSelector
                        selectedBankIds={selectedBankIds}
                        onBankSelect={handleBankSelect}
                        availableBanks={banks.slice(6)}
                        className="max-h-32"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Cards Section */}
          <section className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              {hasActiveFilters ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      Search Results ({cards.length} cards)
                    </h3>
                    <button
                      onClick={handleClearFilters}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                  <CardGrid cards={cards} loading={loading} error={error} />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">All Credit Cards ({cards.length})</h3>
                    <Link
                      to="/search"
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Advanced Search
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <FeaturedCards 
                    cards={cards}
                    loading={loading}
                    showAllCards={showAllCards}
                    onShowAllToggle={handleShowAllToggle}
                  />
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
      />
    </div>
  );
};

export default Index;
