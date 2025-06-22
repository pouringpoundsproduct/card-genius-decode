
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

interface SearchHeaderProps {
  hasActiveFilters: boolean;
  selectedTags: string[];
  selectedBankIds: string[];
  showFreeCards: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  hasActiveFilters,
  selectedTags,
  selectedBankIds,
  showFreeCards,
  showFilters,
  onToggleFilters
}) => {
  const activeFiltersCount = selectedTags.length + selectedBankIds.length + (showFreeCards ? 1 : 0);

  return (
    <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleFilters}
              className="lg:hidden bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
