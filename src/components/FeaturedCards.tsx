
import React from 'react';
import { CreditCardItem } from './CreditCardItem';
import { CreditCard } from '../types/card';
import { Sparkles, TrendingUp } from 'lucide-react';

interface FeaturedCardsProps {
  cards: CreditCard[];
  loading: boolean;
}

export const FeaturedCards: React.FC<FeaturedCardsProps> = ({ cards, loading }) => {
  console.log('FeaturedCards received cards:', cards, 'type:', typeof cards, 'isArray:', Array.isArray(cards));

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
            <h3 className="text-2xl font-bold text-white">Featured Cards</h3>
          </div>
          <p className="text-gray-400">Handpicked premium cards for smart spenders</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
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

  // Ensure cards is always an array
  const safeCards = Array.isArray(cards) ? cards : [];
  const featuredCards = safeCards.slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
          <h3 className="text-2xl font-bold text-white">Featured Cards</h3>
        </div>
        <p className="text-gray-400 text-lg">
          Handpicked premium cards for smart spenders like you
        </p>
      </div>

      {/* Featured Cards Grid */}
      {featuredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCards.map((card) => (
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

      {/* Show More Section */}
      {safeCards.length > 6 && (
        <div className="text-center">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
            Explore All {safeCards.length} Cards
          </button>
        </div>
      )}
    </div>
  );
};
