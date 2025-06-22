
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search..." 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative transition-all duration-300 ${
      isFocused ? 'transform scale-105' : ''
    }`}>
      <div className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-2xl transition-all duration-300 ${
        isFocused 
          ? 'border-purple-500/50 shadow-2xl shadow-purple-500/25' 
          : 'border-gray-700/50 hover:border-gray-600/50'
      }`}>
        <div className="flex items-center">
          <Search className="h-6 w-6 text-gray-400 ml-6" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-5 bg-transparent text-white placeholder-gray-400 text-lg focus:outline-none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {value && (
            <button
              onClick={handleClear}
              className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>
      
      {/* Subtle glow effect */}
      {isFocused && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl -z-10"></div>
      )}
    </div>
  );
};
