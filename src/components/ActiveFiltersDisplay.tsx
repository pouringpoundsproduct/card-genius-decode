
import React from 'react';

interface ActiveFiltersDisplayProps {
  hasActiveFilters: boolean;
  showFreeCards: boolean;
  selectedBankIds: string[];
  selectedTags: string[];
  banks: any[];
  tags: any[];
  onFreeCardsToggle: () => void;
  onBankSelect: (bankId: string) => void;
  onTagSelect: (tagSlug: string) => void;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  hasActiveFilters,
  showFreeCards,
  selectedBankIds,
  selectedTags,
  banks,
  tags,
  onFreeCardsToggle,
  onBankSelect,
  onTagSelect
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-400 mb-2">Active filters:</p>
      <div className="flex flex-wrap gap-2">
        {showFreeCards && (
          <button
            onClick={onFreeCardsToggle}
            className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-medium hover:bg-green-500/30 transition-colors"
          >
            Free Cards
            <span className="text-green-300">×</span>
          </button>
        )}
        {selectedBankIds.map((bankId) => {
          const bank = banks.find(b => b.id === bankId);
          return bank ? (
            <button
              key={bankId}
              onClick={() => onBankSelect(bankId)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium hover:bg-blue-500/30 transition-colors"
            >
              {bank.name}
              <span className="text-blue-300">×</span>
            </button>
          ) : null;
        })}
        {selectedTags.map((tag) => {
          const tagData = tags.find(t => (t.slug || t.id) === tag);
          return (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-500/30 transition-colors"
            >
              {tagData?.name || tag.replace('-', ' ').toUpperCase()}
              <span className="text-purple-300">×</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
