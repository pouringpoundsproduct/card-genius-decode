import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Gift, Star, CreditCard, ExternalLink, 
  Shield, Percent, Calendar, Users, Award, Plane, DollarSign,
  Clock, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCardData } from '../hooks/useCardData';
import { CreditCard as CreditCardType } from '../types/card';
import { ComparisonButton } from '../components/ComparisonButton';

const CardDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getCardDetails, loading, error } = useCardData();
  const [card, setCard] = useState<CreditCardType | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    features: true,
    eligibility: false,
    otherInfo: false
  });

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Helper function to safely format fee values
  const formatFee = (fee: number | string) => {
    if (fee === 0 || fee === '0' || !fee) {
      return <span className="text-green-400">FREE</span>;
    }
    return `₹${fee}`;
  };

  const ExpandableSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    sectionKey: string;
    itemCount?: number;
  }> = ({ title, icon, children, sectionKey, itemCount }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-xl font-bold">
              {title}
              {itemCount && <span className="text-gray-400 font-normal ml-2">({itemCount})</span>}
            </h2>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6">
            {children}
          </div>
        )}
      </section>
    );
  };

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

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Card Overview Section */}
        <section className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-6 w-6 text-purple-400" />
                <span className="text-purple-400 font-medium">{card.bank_name}</span>
              </div>
              <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {card.name}
              </h1>
              
              {card.nick_name && (
                <p className="text-gray-300 text-lg mb-4">{card.nick_name}</p>
              )}
              
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
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center gap-2 transform hover:scale-105 shadow-lg"
                >
                  Apply Now
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}
            </div>
            
            <div className="order-1 lg:order-2">
              {card.image ? (
                <img 
                  src={card.image} 
                  alt={card.name}
                  className="w-full max-w-md h-64 object-contain rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full max-w-md h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto ${card.image ? 'hidden' : ''}`}>
                <div className="text-center">
                  <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">{card.bank_name}</p>
                  <p className="text-gray-400 text-sm">{card.name}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fee Structure Section */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-400" />
            Fee Structure
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-blue-400">Joining Fee</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatFee(card.joining_fee)}
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Percent className="h-5 w-5 text-orange-400" />
                <h3 className="font-semibold text-orange-400">Annual Fee</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatFee(card.annual_fee)}
              </p>
            </div>
          </div>
        </section>

        {/* Welcome Offer Section */}
        {card.welcome_offer && (
          <section className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <Gift className="h-6 w-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold">Welcome Offer</h2>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20">
              <p className="text-lg text-gray-200 leading-relaxed">{card.welcome_offer}</p>
            </div>
          </section>
        )}

        {/* Key Benefits Section */}
        {card.features && card.features.length > 0 && (
          <ExpandableSection
            title="Key Benefits & Features"
            icon={<Award className="h-6 w-6 text-yellow-400" />}
            sectionKey="features"
            itemCount={card.features.length}
          >
            <div className="grid gap-4">
              {card.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-purple-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <p className="text-gray-200 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Reward Structure Section */}
        {(card.cashback_rate || card.reward_rate) && (
          <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Percent className="h-6 w-6 text-blue-400" />
              Reward Structure
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {card.cashback_rate && (
                <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
                  <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cashback Rate
                  </h3>
                  <p className="text-gray-200 text-lg">{card.cashback_rate}</p>
                </div>
              )}
              {card.reward_rate && (
                <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20">
                  <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Reward Rate
                  </h3>
                  <p className="text-gray-200 text-lg">{card.reward_rate}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Eligibility Criteria Section */}
        {card.eligibility && card.eligibility.length > 0 && (
          <ExpandableSection
            title="Eligibility Criteria"
            icon={<Users className="h-6 w-6 text-green-400" />}
            sectionKey="eligibility"
            itemCount={card.eligibility.length}
          >
            <div className="grid gap-3">
              {card.eligibility.map((criteria, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <Shield className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-gray-200">{criteria}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Additional Information Section */}
        {card.other_info && card.other_info.length > 0 && (
          <ExpandableSection
            title="Additional Information"
            icon={<Info className="h-6 w-6 text-blue-400" />}
            sectionKey="otherInfo"
            itemCount={card.other_info.length}
          >
            <div className="space-y-4">
              {card.other_info.map((info, index) => (
                <div key={index} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <p className="text-gray-200 leading-relaxed">{info}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Airport Lounge Access */}
        {card.lounge_access && (
          <section className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Plane className="h-6 w-6 text-indigo-400" />
              Airport Lounge Access
            </h2>
            <div className="flex items-center gap-3 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <CheckCircle className="h-5 w-5 text-indigo-400" />
              <p className="text-gray-200">This card provides airport lounge access benefits</p>
            </div>
          </section>
        )}

        {/* Bottom CTA Section */}
        <section className="text-center bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
          <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">Ready to unlock your card's potential?</h3>
          <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands who've discovered their perfect credit card match with {card.name}.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {card.apply_url && (
              <a
                href={card.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center gap-2 shadow-lg transform hover:scale-105"
              >
                Apply Now
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <Link
              to="/"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Compare More Cards
            </Link>
          </div>
        </section>
      </div>

      <ComparisonButton />
    </div>
  );
};

export default CardDetail;
