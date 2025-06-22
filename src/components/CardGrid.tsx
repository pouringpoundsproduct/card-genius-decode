
import React from 'react';
import { CreditCardItem } from './CreditCardItem';
import { CreditCard as CreditCardType } from '../types/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface CardGridProps {
  cards: CreditCardType[];
  loading: boolean;
  error?: string | null;
}

export const CardGrid: React.FC<CardGridProps> = ({ cards, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Finding your perfect cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCardType className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No cards found</h3>
          <p className="text-gray-400 mb-6">
            Try adjusting your filters or search for something else. 
            There are amazing cards waiting to be discovered!
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            Browse All Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {cards.map((card) => (
        <CreditCardItem key={card.id || card.slug} card={card} />
      ))}
    </div>
  );
};
