
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreditCard } from '../types/card';

interface ComparisonContextType {
  comparisonCards: CreditCard[];
  addToComparison: (card: CreditCard) => void;
  removeFromComparison: (cardId: string) => void;
  clearComparison: () => void;
  isInComparison: (cardId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

interface ComparisonProviderProps {
  children: ReactNode;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [comparisonCards, setComparisonCards] = useState<CreditCard[]>([]);

  const addToComparison = (card: CreditCard) => {
    if (comparisonCards.length >= 3) {
      alert('You can compare up to 3 cards only');
      return;
    }
    if (!comparisonCards.find(c => c.id === card.id)) {
      setComparisonCards([...comparisonCards, card]);
    }
  };

  const removeFromComparison = (cardId: string) => {
    setComparisonCards(comparisonCards.filter(card => card.id !== cardId));
  };

  const clearComparison = () => {
    setComparisonCards([]);
  };

  const isInComparison = (cardId: string) => {
    return comparisonCards.some(card => card.id === cardId);
  };

  return (
    <ComparisonContext.Provider value={{
      comparisonCards,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};
