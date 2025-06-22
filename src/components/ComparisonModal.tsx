
import React from 'react';
import { X, DollarSign, Gift, Star, CheckCircle } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const { comparisonCards, removeFromComparison, clearComparison } = useComparison();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Compare Cards</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={clearComparison}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {comparisonCards.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No cards to compare</h3>
            <p className="text-gray-400">Add cards to comparison to see them here</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisonCards.map((card) => (
                <div key={card.id} className="bg-gray-800/50 rounded-xl p-6 relative">
                  <button
                    onClick={() => removeFromComparison(card.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="mb-4">
                    {card.image ? (
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-full h-32 object-contain rounded-lg bg-gray-900"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{card.bank_name}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{card.name}</h3>
                  <p className="text-purple-400 text-sm mb-4">{card.bank_name}</p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Joining Fee</p>
                        <p className="text-white font-semibold">
                          {card.joining_fee === 0 || card.joining_fee === '0' ? 'FREE' : `₹${card.joining_fee}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Annual Fee</p>
                        <p className="text-white font-semibold">
                          {card.annual_fee === 0 || card.annual_fee === '0' ? 'FREE' : `₹${card.annual_fee}`}
                        </p>
                      </div>
                    </div>

                    {card.welcome_offer && (
                      <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                        <p className="text-purple-400 text-xs font-medium mb-1">Welcome Offer</p>
                        <p className="text-white text-sm line-clamp-2">{card.welcome_offer}</p>
                      </div>
                    )}

                    {card.features && card.features.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Key Features</p>
                        <div className="space-y-1">
                          {card.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-300 text-xs line-clamp-1">{feature}</p>
                            </div>
                          ))}
                          {card.features.length > 3 && (
                            <p className="text-gray-500 text-xs">+{card.features.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
