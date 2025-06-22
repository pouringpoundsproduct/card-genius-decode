
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gift, Star, CreditCard, ExternalLink, Shield, Percent, Calendar, Users } from 'lucide-react';
import { useCardData } from '../hooks/useCardData';
import { CreditCard as CreditCardType } from '../types/card';

const CardDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getCardDetails, loading, error } = useCardData();
  const [card, setCard] = useState<CreditCardType | null>(null);

  useEffect(() => {
    const loadCard = async () => {
      if (slug) {
        console.log('Loading card details for:', slug);
        const cardData = await getCardDetails(slug);
        console.log('Card data received:', cardData);
        setCard(cardData);
      }
    };
    
    loadCard();
  }, [slug, getCardDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-800 rounded"></div>
              <div className="h-32 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-24 w-24 text-gray-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Card not found</h1>
          <p className="text-gray-400 mb-8">The card you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            to="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to search
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              {card.image ? (
                <img 
                  src={card.image} 
                  alt={card.name}
                  className="w-full max-w-sm h-64 object-contain rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900"
                />
              ) : (
                <div className="w-full max-w-sm h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">{card.bank_name}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-purple-400 font-medium mb-2">{card.bank_name}</p>
                <h1 className="text-3xl font-bold mb-4">{card.name}</h1>
                
                {/* Fee Structure */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-400 text-sm">Joining Fee</p>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {card.joining_fee === 0 || card.joining_fee === '0' ? 'FREE' : `₹${card.joining_fee}`}
                    </p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-400 text-sm">Annual Fee</p>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {card.annual_fee === 0 || card.annual_fee === '0' ? 'FREE' : `₹${card.annual_fee}`}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {card.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/30"
                      >
                        <Star className="h-3 w-3" />
                        {typeof tag === 'string' ? tag.replace('-', ' ').toUpperCase() : String(tag)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Apply Button */}
                {card.apply_url && (
                  <a
                    href={card.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-flex items-center gap-2 transform hover:scale-105"
                  >
                    Apply Now
                    <ArrowRight className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Offer */}
        {card.welcome_offer && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 mb-12">
            <div className="flex items-center mb-4">
              <Gift className="h-6 w-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold">Welcome Offer</h2>
            </div>
            <p className="text-lg text-gray-200">{card.welcome_offer}</p>
          </div>
        )}

        {/* Key Features */}
        {card.features && card.features.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Star className="h-6 w-6 text-purple-400" />
              Key Features
            </h2>
            <div className="grid gap-4">
              {card.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <Star className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-200 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility Criteria */}
        {card.eligibility && card.eligibility.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Users className="h-6 w-6 text-green-400" />
              Eligibility Criteria
            </h2>
            <div className="grid gap-3">
              {card.eligibility.map((criteria, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <p className="text-gray-200">{criteria}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {card.other_info && card.other_info.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Additional Information</h2>
            <div className="space-y-4">
              {card.other_info.map((info, index) => (
                <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <p className="text-gray-200 leading-relaxed">{info}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Information */}
        {(card.cashback_rate || card.reward_rate) && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Percent className="h-6 w-6 text-blue-400" />
              Reward Structure
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {card.cashback_rate && (
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <h3 className="font-semibold text-blue-400 mb-2">Cashback Rate</h3>
                  <p className="text-gray-200">{card.cashback_rate}</p>
                </div>
              )}
              {card.reward_rate && (
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="font-semibold text-purple-400 mb-2">Reward Rate</h3>
                  <p className="text-gray-200">{card.reward_rate}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to unlock your card's potential?</h3>
          <p className="text-gray-300 mb-6">Join thousands who've discovered their perfect credit card match.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            {card.apply_url && (
              <a
                href={card.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-flex items-center gap-2"
              >
                Apply Now
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <Link
              to="/"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Compare More Cards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetail;
