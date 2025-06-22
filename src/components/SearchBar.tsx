
import React, { useState, useEffect, useCallback } from 'react';
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
  placeholder = "Search credit cards...",
  className = "",
  debounceMs = 300
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const debouncedOnChange = useCallback(
    (searchValue: string) => {
      const timeoutId = setTimeout(() => {
        onChange(searchValue);
        setIsLoading(false);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [onChange, debounceMs]
  );

  useEffect(() => {
    if (localValue !== value) {
      setIsLoading(true);
      const cleanup = debouncedOnChange(localValue);
      return cleanup;
    }
  }, [localValue, value, debouncedOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
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
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
