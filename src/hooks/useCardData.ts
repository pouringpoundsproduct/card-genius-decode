
import { useState, useCallback } from 'react';
import { CreditCard } from '../types/card';
import { cardService } from '../services/cardService';

export const useCardData = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCards = useCallback(async (query: string = '', tags: string[] = []) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching for cards:', { query, tags });
      const result = await cardService.searchCards(query, tags);
      console.log('Search results:', result);
      setCards(result);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards. Please try again.');
      // Set some mock data for demo purposes
      setCards(getMockCards());
    } finally {
      setLoading(false);
    }
  }, []);

  const getCardDetails = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const card = await cardService.getCardDetails(slug);
      return card;
    } catch (err) {
      console.error('Error fetching card details:', err);
      setError('Failed to load card details. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cards,
    loading,
    error,
    searchCards,
    getCardDetails
  };
};

// Mock data for demo purposes
const getMockCards = (): CreditCard[] => [
  {
    id: '1',
    name: 'HDFC Regalia Gold Credit Card',
    slug: 'hdfc-regalia-gold',
    image: '/api/placeholder/300/200',
    bank_name: 'HDFC Bank',
    joining_fee: 2500,
    annual_fee: 2500,
    welcome_offer: 'Get 2,500 reward points on payment of joining fee',
    apply_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card',
    tags: ['rewards', 'airport-lounge', 'fuel'],
    features: ['4 complimentary airport lounge visits per quarter', '1% fuel surcharge waiver', '2X reward points on weekend dining']
  },
  {
    id: '2',
    name: 'SBI SimplyCLICK Credit Card',
    slug: 'sbi-simplyclick',
    image: '/api/placeholder/300/200',
    bank_name: 'State Bank of India',
    joining_fee: 499,
    annual_fee: 0,
    welcome_offer: 'Get 2,000 bonus reward points on payment of joining fee',
    apply_url: 'https://www.sbi.co.in/web/personal-banking/cards/credit-cards/rewards-cards/simplyclick-advantage-card',
    tags: ['ltf', 'cashback', 'shopping'],
    features: ['10X reward points on online spends', '1% fuel surcharge waiver', 'Annual fee waiver on spends above ₹1 lakh']
  },
  {
    id: '3',
    name: 'ICICI Bank Emeralde Credit Card',
    slug: 'icici-emeralde',
    image: '/api/placeholder/300/200',
    bank_name: 'ICICI Bank',
    joining_fee: 12000,
    annual_fee: 12000,
    welcome_offer: 'Get 12,000 reward points on payment of joining fee',
    apply_url: 'https://www.icicibank.com/personal-banking/cards/credit-card/emeralde-credit-card',
    tags: ['travel', 'airport-lounge', 'rewards'],
    features: ['Unlimited airport lounge access', 'Golf privileges', 'Concierge services']
  }
];
