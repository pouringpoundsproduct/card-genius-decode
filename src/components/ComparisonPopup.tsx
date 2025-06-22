
import React from 'react';
import { X, ArrowRight, CreditCard, DollarSign, Gift, Star } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';
import { CreditCard as CreditCardType } from '../types/card';
import { Button } from './ui/button';

interface ComparisonPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonPopup: React.FC<ComparisonPopupProps> = ({ isOpen, onClose }) => {
  const { comparisonCards, removeFromComparison, clearComparison } = useComparison();

  if (!isOpen) return null;

  const ComparisonCard: React.FC<{ card: CreditCardType }> = ({ card }) => (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {card.image ? (
            <img 
              src={card.image} 
              alt={card.name}
              className="w-full h-32 object-contain rounded-lg bg-gray-900 mb-4"
            />
          ) : (
            <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-gray-600" />
            </div>
          )}
          <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{card.name}</h3>
          <p className="text-purple-400 text-sm mb-4">{card.bank_name}</p>
        </div>
        <button
          onClick={() => removeFromComparison(card.id)}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Joining Fee</span>
          <span className="text-white font-semibold">
            {card.joining_fee === 0 || card.joining_fee === '0' ? 'FREE' : `₹${card.joining_fee}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Annual Fee</span>
          <span className="text-white font-semibold">
            {card.annual_fee === 0 || card.annual_fee === '0' ? 'FREE' : `₹${card.annual_fee}`}
          </span>
        </div>
        {card.welcome_offer && (
          <div>
            <span className="text-gray-400">Welcome Offer</span>
            <p className="text-white text-sm mt-1 line-clamp-2">{card.welcome_offer}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Compare Cards</h2>
            <p className="text-gray-400">Compare up to 3 credit cards side by side</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {comparisonCards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No cards to compare</h3>
              <p className="text-gray-400">Add cards to comparison to see them here</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {comparisonCards.map((card) => (
                  <ComparisonCard key={card.id} card={card} />
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={clearComparison}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Clear All
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Close Comparison
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
