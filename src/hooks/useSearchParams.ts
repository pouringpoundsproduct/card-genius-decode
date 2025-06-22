
import { useEffect } from 'react';
import { useSearchParams as useRouterSearchParams } from 'react-router-dom';

interface UseSearchParamsProps {
  searchQuery: string;
  selectedTags: string[];
  selectedBankIds: string[];
  showFreeCards: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedBankIds: (ids: string[]) => void;
  setShowFreeCards: (show: boolean) => void;
  onSearch: (query: string, tags: string[], bankIds: string[], freeCards: boolean) => void;
}

export const useSearchParams = ({
  searchQuery,
  selectedTags,
  selectedBankIds,
  showFreeCards,
  setSearchQuery,
  setSelectedTags,
  setSelectedBankIds,
  setShowFreeCards,
  onSearch
}: UseSearchParamsProps) => {
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Helper function to safely convert string to boolean
  const stringToBoolean = (value: string | null): boolean => {
    return value === 'true';
  };

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const urlBankIds = searchParams.get('banks')?.split(',').filter(Boolean) || [];
    const urlFreeCards = stringToBoolean(searchParams.get('free'));

    setSearchQuery(urlQuery);
    setSelectedTags(urlTags);
    setSelectedBankIds(urlBankIds);
    setShowFreeCards(urlFreeCards);

    // Perform initial search with URL parameters
    onSearch(urlQuery, urlTags, urlBankIds, urlFreeCards);
  }, []);

  const updateURL = (query: string, tagsList: string[], bankIds: string[], freeCards: boolean) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tagsList.length > 0) params.set('tags', tagsList.join(','));
    if (bankIds.length > 0) params.set('banks', bankIds.join(','));
    if (freeCards) params.set('free', 'true');
    setSearchParams(params);
  };

  // Update URL whenever search state changes
  useEffect(() => {
    updateURL(searchQuery, selectedTags, selectedBankIds, showFreeCards);
  }, [searchQuery, selectedTags, selectedBankIds, showFreeCards]);

  return { updateURL };
};
