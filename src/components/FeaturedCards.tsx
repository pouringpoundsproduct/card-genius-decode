
import React, { useState } from 'react';
import { CreditCardItem } from './CreditCardItem';
import { CreditCard } from '../types/card';
import { Sparkles, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedCardsProps {
  cards: CreditCard[];
  loading: boolean;
  showAllCards?: boolean;
  onShowAllToggle?: () => void;
}

export const FeaturedCards: React.FC<FeaturedCardsProps> = ({ 
  cards, 
  loading, 
  showAllCards = false,
  onShowAllToggle 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 9;

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
            <h3 className="text-2xl font-bold text-white">
              {showAllCards ? 'All Cards' : 'Featured Cards'}
            </h3>
          </div>
          <p className="text-gray-400">
            {showAllCards ? 'Loading all available cards...' : 'Handpicked premium cards for smart spenders'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(cardsPerPage)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-800 rounded-xl mb-6"></div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                <div className="h-20 bg-gray-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayCards = showAllCards ? cards : cards.slice(0, 6);
  const totalPages = showAllCards ? Math.ceil(cards.length / cardsPerPage) : 1;
  
  const paginatedCards = showAllCards 
    ? cards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
    : displayCards;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
          <h3 className="text-2xl font-bold text-white">
            {showAllCards ? 'All Cards' : 'Featured Cards'}
          </h3>
        </div>
        <p className="text-gray-400 text-lg">
          {showAllCards 
            ? `Showing ${paginatedCards.length} of ${cards.length} cards`
            : 'Handpicked premium cards for smart spenders like you'
          }
        </p>
      </div>

      {/* Cards Grid */}
      {paginatedCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedCards.map((card) => (
            <CreditCardItem key={card.id || card.slug} card={card} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="h-12 w-12 text-gray-600" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">Cards loading...</h4>
          <p className="text-gray-400">
            We're fetching the best cards for you. This might take a moment.
          </p>
        </div>
      )}

      {/* Pagination for All Cards */}
      {showAllCards && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
              
              if (!showPage && page !== 2 && page !== totalPages - 1) {
                if (page === 3 && currentPage > 5) return <span key={page} className="text-gray-400">...</span>;
                if (page === totalPages - 2 && currentPage < totalPages - 4) return <span key={page} className="text-gray-400">...</span>;
                return null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    isCurrentPage
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Show More/Less Section */}
      {!showAllCards && cards.length > 6 && (
        <div className="text-center">
          <button 
            onClick={onShowAllToggle}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
          >
            Explore All {cards.length} Cards
          </button>
        </div>
      )}

      {showAllCards && (
        <div className="text-center">
          <button 
            onClick={onShowAllToggle}
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300"
          >
            Show Featured Cards Only
          </button>
        </div>
      )}
    </div>
  );
};
