
import React, { useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';
import { ComparisonPopup } from './ComparisonPopup';

export const ComparisonButton: React.FC = () => {
  const { comparisonCards, clearComparison } = useComparison();
  const [showPopup, setShowPopup] = useState(false);

  if (comparisonCards.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg border border-purple-500/30 overflow-hidden">
          <button
            onClick={() => setShowPopup(true)}
            className="flex items-center gap-3 px-6 py-4 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Compare ({comparisonCards.length})</span>
          </button>
          {comparisonCards.length > 0 && (
            <button
              onClick={clearComparison}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Clear all comparisons"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <ComparisonPopup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
      />
    </>
  );
};
