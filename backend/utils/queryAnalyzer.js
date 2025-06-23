
function analyzeQuery(query) {
  const queryLower = query.toLowerCase();
  
  const patterns = {
    cardSearch: /\b(card|credit card|best card|recommend|suggestion)\b/i,
    bankSpecific: /\b(hdfc|sbi|axis|icici|kotak|indusind|american express|amex)\b/i,
    categorySpecific: /\b(fuel|travel|cashback|dining|shopping|grocery|lounge)\b/i,
    comparison: /\b(compare|vs|versus|difference|better)\b/i,
    spending: /\b(spend|spending|calculate|recommendation|budget)\b/i,
    content: /\b(content|article|post|write|create|blog|social media)\b/i
  };
  
  return {
    isCardQuery: patterns.cardSearch.test(queryLower) || patterns.bankSpecific.test(queryLower) || patterns.categorySpecific.test(queryLower),
    isComparison: patterns.comparison.test(queryLower),
    isSpendingQuery: patterns.spending.test(queryLower),
    isContentQuery: patterns.content.test(queryLower),
    bankMentioned: queryLower.match(patterns.bankSpecific)?.[0] || null,
    categoryMentioned: queryLower.match(patterns.categorySpecific)?.[0] || null
  };
}

function generateSlugFromQuery(query) {
  return query.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

module.exports = {
  analyzeQuery,
  generateSlugFromQuery
};
