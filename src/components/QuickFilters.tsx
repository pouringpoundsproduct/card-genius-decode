
import React from 'react';
import { Zap, Building2, Tag } from 'lucide-react';

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
      onClick: () => onQuickFilter('ltf')
    },
    {
      id: 'sbi',
      label: 'SBI Cards',
      icon: Building2,
      active: selectedBankIds.includes('2'),
      onClick: () => onQuickFilter('bank', '2')
    },
    {
      id: 'hdfc',
      label: 'HDFC Bank',
      icon: Building2,
      active: selectedBankIds.includes('1'),
      onClick: () => onQuickFilter('bank', '1')
    },
    {
      id: 'icici',
      label: 'ICICI Bank',
      icon: Building2,
      active: selectedBankIds.includes('14'),
      onClick: () => onQuickFilter('bank', '14')
    },
    {
      id: 'fuel',
      label: 'Fuel Cards',
      icon: Tag,
      active: selectedTags.includes('best-fuel-credit-card'),
      onClick: () => onQuickFilter('category', 'best-fuel-credit-card')
    },
    {
      id: 'cashback',
      label: 'High Cashback',
      icon: Tag,
      active: selectedTags.includes('best-shopping-credit-card'),
      onClick: () => onQuickFilter('category', 'best-shopping-credit-card')
    },
    {
      id: 'travel',
      label: 'Travel Cards',
      icon: Tag,
      active: selectedTags.includes('best-travel-credit-card'),
      onClick: () => onQuickFilter('category', 'best-travel-credit-card')
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {quickFilterOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.onClick}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                option.active
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              {option.active && <span className="text-purple-300">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
