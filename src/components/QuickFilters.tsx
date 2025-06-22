
import React from 'react';
import { Zap, Building2, Tag, CreditCard, Percent, Plane, ShoppingCart, Car, Utensils } from 'lucide-react';

interface QuickFiltersProps {
  showFreeCards: boolean;
  selectedBankIds: string[];
  selectedTags: string[];
  banks: any[];
  tags: any[];
  onQuickFilter: (filterType: string, value?: any) => void;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  showFreeCards,
  selectedBankIds,
  selectedTags,
  banks,
  tags,
  onQuickFilter
}) => {
  const quickFilterOptions = [
    {
      id: 'ltf',
      label: 'LTF Cards',
      icon: Zap,
      active: showFreeCards,
      onClick: () => onQuickFilter('ltf'),
      color: 'green'
    },
    {
      id: 'sbi',
      label: 'SBI Cards',
      icon: Building2,
      active: selectedBankIds.includes('2'),
      onClick: () => onQuickFilter('bank', '2'),
      color: 'blue'
    },
    {
      id: 'hdfc',
      label: 'HDFC Bank',
      icon: Building2,
      active: selectedBankIds.includes('1'),
      onClick: () => onQuickFilter('bank', '1'),
      color: 'blue'
    },
    {
      id: 'icici',
      label: 'ICICI Bank',
      icon: Building2,
      active: selectedBankIds.includes('14'),
      onClick: () => onQuickFilter('bank', '14'),
      color: 'blue'
    },
    {
      id: 'axis',
      label: 'Axis Bank',
      icon: Building2,
      active: selectedBankIds.includes('3'),
      onClick: () => onQuickFilter('bank', '3'),
      color: 'blue'
    },
    {
      id: 'kotak',
      label: 'Kotak Bank',
      icon: Building2,
      active: selectedBankIds.includes('4'),
      onClick: () => onQuickFilter('bank', '4'),
      color: 'blue'
    },
    {
      id: 'fuel',
      label: 'Fuel Cards',
      icon: Car,
      active: selectedTags.includes('best-fuel-credit-card'),
      onClick: () => onQuickFilter('category', 'best-fuel-credit-card'),
      color: 'orange'
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: ShoppingCart,
      active: selectedTags.includes('best-shopping-credit-card'),
      onClick: () => onQuickFilter('category', 'best-shopping-credit-card'),
      color: 'pink'
    },
    {
      id: 'travel',
      label: 'Travel Cards',
      icon: Plane,
      active: selectedTags.includes('best-travel-credit-card'),
      onClick: () => onQuickFilter('category', 'best-travel-credit-card'),
      color: 'indigo'
    },
    {
      id: 'dining',
      label: 'Dining',
      icon: Utensils,
      active: selectedTags.includes('best-dining-credit-card'),
      onClick: () => onQuickFilter('category', 'best-dining-credit-card'),
      color: 'yellow'
    },
    {
      id: 'lounge',
      label: 'Airport Lounge',
      icon: Plane,
      active: selectedTags.includes('A-b-c-d'),
      onClick: () => onQuickFilter('category', 'A-b-c-d'),
      color: 'purple'
    },
    {
      id: 'cashback',
      label: 'High Cashback',
      icon: Percent,
      active: selectedTags.includes('best-cashback-credit-card'),
      onClick: () => onQuickFilter('category', 'best-cashback-credit-card'),
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string, active: boolean) => {
    const colorMap = {
      green: active 
        ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-green-500/10 hover:border-green-500/30',
      blue: active
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-blue-500/10 hover:border-blue-500/30',
      orange: active
        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-orange-500/10 hover:border-orange-500/30',
      pink: active
        ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-pink-500/10 hover:border-pink-500/30',
      indigo: active
        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-indigo-500/10 hover:border-indigo-500/30',
      yellow: active
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-yellow-500/10 hover:border-yellow-500/30',
      purple: active
        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-purple-500/10 hover:border-purple-500/30',
      emerald: active
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg'
        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-emerald-500/10 hover:border-emerald-500/30'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {quickFilterOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.onClick}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${getColorClasses(option.color, option.active)}`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              {option.active && <span className="text-xs">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
