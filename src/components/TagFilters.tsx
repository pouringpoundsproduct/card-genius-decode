
import React from 'react';

interface TagFiltersProps {
  selectedTags: string[];
  onTagSelect: (tagSlug: string) => void;
  availableTags?: Array<{ id: string; name: string; slug?: string }>;
}

const getTagColor = (tagName: string) => {
  const colorMap: { [key: string]: string } = {
    'fuel': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'shopping': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'airport lounge': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'online food ordering': 'bg-red-500/20 text-red-400 border-red-500/30',
    'dining': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'grocery shopping': 'bg-green-500/20 text-green-400 border-green-500/30',
    'travel': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'utility bills': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'default': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  
  const key = tagName.toLowerCase();
  return colorMap[key] || colorMap['default'];
};

export const TagFilters: React.FC<TagFiltersProps> = ({ 
  selectedTags, 
  onTagSelect, 
  availableTags = [] 
}) => {
  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {availableTags.map((tag) => {
        const tagSlug = tag.slug || tag.id;
        const isSelected = selectedTags.includes(tagSlug);
        const tagColor = getTagColor(tag.name);
        
        return (
          <button
            key={tag.id}
            onClick={() => onTagSelect(tagSlug)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border ${
              isSelected
                ? `${tagColor} shadow-lg transform scale-105`
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
