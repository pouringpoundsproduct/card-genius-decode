
import React from 'react';

interface BankSelectorProps {
  selectedBankIds: string[];
  onBankSelect: (bankId: string) => void;
  availableBanks: Array<{ id: string; name: string }>;
  className?: string;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBankIds,
  onBankSelect,
  availableBanks,
  className = ""
}) => {
  if (availableBanks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-300 mb-3">Select Banks</h4>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {availableBanks.map((bank) => {
          const isSelected = selectedBankIds.includes(bank.id);
          
          return (
            <button
              key={bank.id}
              onClick={() => onBankSelect(bank.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-300 hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {bank.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
