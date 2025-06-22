
import React from 'react';
import { Filter, CreditCard, Building2, Tag, DollarSign, Users, Award } from 'lucide-react';
import { TagFilters } from './TagFilters';
import { BankSelector } from './BankSelector';

interface SearchFilterSidebarProps {
  hasActiveFilters: boolean;
  showFreeCards: boolean;
  selectedTags: string[];
  selectedBankIds: string[];
  tags: any[];
  banks: any[];
  onClearFilters: () => void;
  onFreeCardsToggle: () => void;
  onTagSelect: (tagSlug: string) => void;
  onBankSelect: (bankId: string) => void;
}

export const SearchFilterSidebar: React.FC<SearchFilterSidebarProps> = ({
  hasActiveFilters,
  showFreeCards,
  selectedTags,
  selectedBankIds,
  tags,
  banks,
  onClearFilters,
  onFreeCardsToggle,
  onTagSelect,
  onBankSelect
}) => {
  const cardTypeFilters = [
    {
      id: 'ltf',
      label: 'Lifetime Free Cards',
      icon: Award,
      active: showFreeCards,
      onClick: onFreeCardsToggle,
      description: 'No annual fee ever'
    }
  ];

  const categoryFilters = [
    { slug: 'best-fuel-credit-card', name: 'Fuel & Gas', icon: '⛽' },
    { slug: 'best-shopping-credit-card', name: 'Shopping & E-commerce', icon: '🛒' },
    { slug: 'best-travel-credit-card', name: 'Travel & Miles', icon: '✈️' },
    { slug: 'best-dining-credit-card', name: 'Dining & Food', icon: '🍽️' },
    { slug: 'A-b-c-d', name: 'Airport Lounge Access', icon: '🏢' },
    { slug: 'best-cashback-credit-card', name: 'High Cashback', icon: '💰' },
    { slug: 'BestCardsforGroceryShopping', name: 'Grocery Shopping', icon: '🛍️' },
    { slug: 'best-utility-credit-card', name: 'Utility Bills', icon: '⚡' }
  ];

  const topBanks = [
    { id: '1', name: 'HDFC Bank', logo: '🏦' },
    { id: '2', name: 'SBI Card', logo: '🏪' },
    { id: '3', name: 'Axis Bank', logo: '🏛️' },
    { id: '4', name: 'Kotak Mahindra Bank', logo: '🏢' },
    { id: '14', name: 'ICICI Bank', logo: '🏦' }
  ];

  return (
    <div className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Filter Header */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-400" />
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          
          {/* Active Filters Count */}
          {hasActiveFilters && (
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-sm text-purple-300">
                {(selectedTags.length + selectedBankIds.length + (showFreeCards ? 1 : 0))} filters active
              </p>
            </div>
          )}
        </div>

        {/* Card Type Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-400" />
            Card Type
          </h4>
          <div className="space-y-3">
            {cardTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={filter.onClick}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    filter.active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-800/30 text-gray-300 border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{filter.label}</p>
                      <p className="text-xs opacity-70">{filter.description}</p>
                    </div>
                    {filter.active && <span className="ml-auto text-green-300">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Banks */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Popular Banks
          </h4>
          <div className="space-y-2">
            {topBanks.map((bank) => {
              const isSelected = selectedBankIds.includes(bank.id);
              
              return (
                <button
                  key={bank.id}
                  onClick={() => onBankSelect(bank.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
                  }`}
                >
                  <span className="text-lg">{bank.logo}</span>
                  <span className="font-medium">{bank.name}</span>
                  {isSelected && <span className="ml-auto text-blue-300">✓</span>}
                </button>
              );
            })}
          </div>
          
          {/* Show All Banks */}
          {banks.length > topBanks.length && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <BankSelector
                selectedBankIds={selectedBankIds}
                onBankSelect={onBankSelect}
                availableBanks={banks.filter(bank => !topBanks.some(tb => tb.id === bank.id))}
                className="max-h-48"
              />
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-400" />
            Categories
          </h4>
          <div className="space-y-2">
            {categoryFilters.map((category) => {
              const isSelected = selectedTags.includes(category.slug);
              
              return (
                <button
                  key={category.slug}
                  onClick={() => onTagSelect(category.slug)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-300 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  {isSelected && <span className="ml-auto text-purple-300">✓</span>}
                </button>
              );
            })}
          </div>
          
          {/* Additional Tags */}
          {tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <TagFilters 
                selectedTags={selectedTags}
                onTagSelect={onTagSelect}
                availableTags={tags.filter(tag => !categoryFilters.some(cf => cf.slug === (tag.slug || tag.id)))}
              />
            </div>
          )}
        </div>

        {/* Fee Range Filter */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            Annual Fee Range
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Free (₹0)', value: 'free' },
              { label: 'Low (₹1 - ₹1,000)', value: 'low' },
              { label: 'Medium (₹1,001 - ₹5,000)', value: 'medium' },
              { label: 'High (₹5,001+)', value: 'high' }
            ].map((range) => (
              <button
                key={range.value}
                className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50 transition-all"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Credit Score Filter */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Credit Score
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Excellent (750+)', value: '750+' },
              { label: 'Good (650-749)', value: '650-749' },
              { label: 'Fair (550-649)', value: '550-649' },
              { label: 'Poor (Below 550)', value: 'below-550' }
            ].map((score) => (
              <button
                key={score.value}
                className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50 transition-all"
              >
                {score.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
