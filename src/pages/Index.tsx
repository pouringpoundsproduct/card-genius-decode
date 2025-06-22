
import React, { useState, useEffect } from 'react';
import { Search, Filter, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { CardGrid } from '../components/CardGrid';
import { TagFilters } from '../components/TagFilters';
import { FeaturedCards } from '../components/FeaturedCards';
import { useCardData } from '../hooks/useCardData';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const { cards, loading, error, banks, tags, searchCards, loadBanksAndTags } = useCardData();

  useEffect(() => {
    // Load initial data - banks, tags, and featured cards
    const initializeData = async () => {
      await loadBanksAndTags();
      searchCards('', [], '', 1);
    };
    
    initializeData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchCards(query, selectedTags, selectedBank, 1);
  };

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    searchCards(searchQuery, newTags, selectedBank, 1);
  };

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    searchCards(searchQuery, selectedTags, bank, 1);
  };

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
        
        {/* Animated background elements */}
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

      {/* Bank Filter (if we have active filters) */}
      {(searchQuery || selectedTags.length > 0 || selectedBank) && banks.length > 0 && (
        <section className="px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-4">
              <h4 className="text-md font-medium text-gray-300 mr-4">Banks:</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBankSelect('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !selectedBank
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  All Banks
                </button>
                {banks.slice(0, 8).map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleBankSelect(bank.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedBank === bank.name
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50'
                    }`}
                  >
                    {bank.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Cards or Search Results */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {searchQuery || selectedTags.length > 0 || selectedBank ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">
                  Search Results
                  {(searchQuery || selectedTags.length > 0 || selectedBank) && (
                    <span className="text-gray-400 font-normal text-lg ml-2">
                      {searchQuery && `for "${searchQuery}"`}
                      {selectedBank && ` • ${selectedBank}`}
                      {selectedTags.length > 0 && ` • ${selectedTags.length} filters`}
                    </span>
                  )}
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
