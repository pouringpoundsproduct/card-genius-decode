
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TagFiltersProps {
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

const availableTags = [
  { id: 'ltf', label: 'Lifetime Free', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'cashback', label: 'Cashback', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'airport-lounge', label: 'Lounge Access', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'fuel', label: 'Fuel Benefits', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'shopping', label: 'Shopping', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'travel', label: 'Travel Card', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'rewards', label: 'Reward Points', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
];

export const TagFilters: React.FC<TagFiltersProps> = ({ selectedTags, onTagSelect }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {availableTags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onTagSelect(tag.id)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border ${
              isSelected
                ? `${tag.color} shadow-lg transform scale-105`
                : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50'
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
};
