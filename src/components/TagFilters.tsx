
import React from 'react';

interface TagFiltersProps {
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  availableTags?: Array<{ id: string; name: string }>;
}

// Fallback tags with proper styling
const fallbackTags = [
  { id: 'ltf', name: 'Lifetime Free', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'cashback', name: 'Cashback', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'airport-lounge', name: 'Lounge Access', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'fuel', name: 'Fuel Benefits', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'shopping', name: 'Shopping', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'travel', name: 'Travel Card', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'rewards', name: 'Reward Points', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
];

const getTagColor = (tagId: string) => {
  const colorMap: { [key: string]: string } = {
    'ltf': 'bg-green-500/20 text-green-400 border-green-500/30',
    'cashback': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'airport-lounge': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'fuel': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'shopping': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'travel': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'rewards': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'default': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return colorMap[tagId] || colorMap['default'];
};

export const TagFilters: React.FC<TagFiltersProps> = ({ 
  selectedTags, 
  onTagSelect, 
  availableTags = [] 
}) => {
  // Use API tags if available, otherwise fallback to predefined tags
  const tagsToShow = availableTags.length > 0 
    ? availableTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: getTagColor(tag.id)
      }))
    : fallbackTags;

  return (
    <div className="flex flex-wrap gap-3">
      {tagsToShow.map((tag) => {
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
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};
