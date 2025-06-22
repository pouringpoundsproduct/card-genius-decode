
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search credit cards, banks, or card names...",
  className = "",
  debounceMs = 500
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search effect
  useEffect(() => {
    if (localValue !== value) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => {
        console.log('Search triggered for:', localValue);
        onChange(localValue);
        setIsLoading(false);
      }, debounceMs);

      return () => {
        clearTimeout(timeoutId);
        setIsLoading(false);
      };
    }
  }, [localValue, value, onChange, debounceMs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Input changed to:', newValue);
    setLocalValue(newValue);
  };

  const handleClear = () => {
    console.log('Clearing search');
    setLocalValue('');
    onChange('');
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Immediately trigger search on Enter
      console.log('Enter pressed, triggering immediate search');
      onChange(localValue);
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
        />
        {(localValue || isLoading) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            )}
            {localValue && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-300 transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Search hints */}
      {localValue.length > 0 && localValue.length < 3 && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700/50 text-sm text-gray-400 z-10">
          Type at least 3 characters to search...
        </div>
      )}
    </div>
  );
};
