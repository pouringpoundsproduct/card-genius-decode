
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Plane, Fuel, ShoppingBag, Star } from 'lucide-react';
import { CreditCard } from '../types/card';

interface CreditCardItemProps {
  card: CreditCard;
}

export const CreditCardItem: React.FC<CreditCardItemProps> = ({ card }) => {
  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'airport-lounge': return <Plane className="h-4 w-4" />;
      case 'fuel': return <Fuel className="h-4 w-4" />;
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      case 'ltf': return <Star className="h-4 w-4" />;
      case 'cashback': return <Gift className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'ltf': return 'bg-green-500/20 text-green-400';
      case 'cashback': return 'bg-blue-500/20 text-blue-400';
      case 'airport-lounge': return 'bg-purple-500/20 text-purple-400';
      case 'fuel': return 'bg-orange-500/20 text-orange-400';
      case 'shopping': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Helper function to safely convert tag to string
  const getTagString = (tag: any): string => {
    if (typeof tag === 'string') {
      return tag;
    }
    if (tag && typeof tag === 'object') {
      return tag.name || tag.slug || tag.id || String(tag);
    }
    return String(tag);
  };

  return (
    <div className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
      {/* Card Image */}
      <div className="relative mb-6">
        {card.image ? (
          <img 
            src={card.image} 
            alt={card.name}
            className="w-full h-48 object-contain rounded-xl bg-gradient-to-br from-gray-800 to-gray-900"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-10 bg-gray-700 rounded-lg mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">{card.bank_name}</p>
            </div>
          </div>
        )}
        
        {/* Bank badge */}
        {card.bank_name && (
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            {card.bank_name}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
          {card.name}
        </h3>

        {/* Fees */}
        <div className="flex justify-between items-center text-sm">
          <div>
            <p className="text-gray-400">Joining Fee</p>
            <p className="text-white font-semibold">
              {card.joining_fee === 0 || card.joining_fee === '0' ? 'FREE' : `₹${card.joining_fee}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Annual Fee</p>
            <p className="text-white font-semibold">
              {card.annual_fee === 0 || card.annual_fee === '0' ? 'FREE' : `₹${card.annual_fee}`}
            </p>
          </div>
        </div>

        {/* Welcome Offer */}
        {card.welcome_offer && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <p className="text-purple-400 text-sm font-medium mb-1">Welcome Offer</p>
            <p className="text-white text-sm line-clamp-2">{card.welcome_offer}</p>
          </div>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.tags.slice(0, 3).map((tag, index) => {
              const tagString = getTagString(tag);
              const displayText = tagString.replace('-', ' ').toUpperCase();
              
              return (
                <span 
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tagString)}`}
                >
                  {getTagIcon(tagString)}
                  {displayText}
                </span>
              );
            })}
            {card.tags.length > 3 && (
              <span className="text-gray-400 text-xs">+{card.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Link 
            to={`/card/${card.slug}`}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
          >
            View Details
          </Link>
          {card.apply_url && (
            <a
              href={card.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-all inline-flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
