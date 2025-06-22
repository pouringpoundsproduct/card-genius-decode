
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreditCard } from '../types/card';

interface ComparisonContextType {
  comparisonCards: CreditCard[];
  addToComparison: (card: CreditCard) => void;
  removeFromComparison: (cardId: string) => void;
  clearComparison: () => void;
  isInComparison: (cardId: string) => boolean;
  maxCards: number;
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
  const maxCards = 3;

  const addToComparison = (card: CreditCard) => {
    console.log('Adding card to comparison:', card.name);
    setComparisonCards(prev => {
      if (prev.length >= maxCards) {
        console.log('Maximum cards reached');
        return prev;
      }
      if (prev.some(c => c.id === card.id)) {
        console.log('Card already in comparison');
        return prev;
      }
      const newCards = [...prev, card];
      console.log('Updated comparison cards:', newCards.length);
      return newCards;
    });
  };

  const removeFromComparison = (cardId: string) => {
    console.log('Removing card from comparison:', cardId);
    setComparisonCards(prev => {
      const newCards = prev.filter(card => card.id !== cardId);
      console.log('Updated comparison cards after removal:', newCards.length);
      return newCards;
    });
  };

  const clearComparison = () => {
    console.log('Clearing all comparison cards');
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
      isInComparison,
      maxCards
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};
