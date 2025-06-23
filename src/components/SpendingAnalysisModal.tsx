
import React, { useState } from 'react';
import { X, Calculator, TrendingUp } from 'lucide-react';

interface SpendingData {
  amazon_spends: number;
  flipkart_spends: number;
  grocery_spends_online: number;
  online_food_ordering: number;
  other_online_spends: number;
  other_offline_spends: number;
  dining_or_going_out: number;
  fuel: number;
  school_fees: number;
  rent: number;
  mobile_phone_bills: number;
  electricity_bills: number;
  water_bills: number;
  ott_channels: number;
  hotels_annual: number;
  flights_annual: number;
  insurance_health_annual: number;
  insurance_car_or_bike_annual: number;
  large_electronics_purchase_like_mobile_tv_etc: number;
  all_pharmacy: number;
  domestic_lounge_usage_quarterly: number;
  international_lounge_usage_quarterly: number;
  railway_lounge_usage_quarterly: number;
  movie_usage: number;
  movie_mov: number;
  dining_usage: number;
  dining_mov: number;
}

interface SpendingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (data: SpendingData) => void;
}

const SpendingAnalysisModal: React.FC<SpendingAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalyze
}) => {
  const [spendingData, setSpendingData] = useState<SpendingData>({
    amazon_spends: 0,
    flipkart_spends: 0,
    grocery_spends_online: 0,
    online_food_ordering: 0,
    other_online_spends: 0,
    other_offline_spends: 0,
    dining_or_going_out: 0,
    fuel: 0,
    school_fees: 0,
    rent: 0,
    mobile_phone_bills: 0,
    electricity_bills: 0,
    water_bills: 0,
    ott_channels: 0,
    hotels_annual: 0,
    flights_annual: 0,
    insurance_health_annual: 0,
    insurance_car_or_bike_annual: 0,
    large_electronics_purchase_like_mobile_tv_etc: 0,
    all_pharmacy: 0,
    domestic_lounge_usage_quarterly: 0,
    international_lounge_usage_quarterly: 0,
    railway_lounge_usage_quarterly: 0,
    movie_usage: 0,
    movie_mov: 0,
    dining_usage: 0,
    dining_mov: 0
  });

  const handleInputChange = (field: keyof SpendingData, value: string) => {
    setSpendingData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = () => {
    onAnalyze(spendingData);
    onClose();
  };

  if (!isOpen) return null;

  const spendingCategories = [
    { label: 'Amazon Spending', field: 'amazon_spends' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Flipkart Spending', field: 'flipkart_spends' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Online Grocery', field: 'grocery_spends_online' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Food Delivery', field: 'online_food_ordering' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Dining Out', field: 'dining_or_going_out' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Fuel', field: 'fuel' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Rent', field: 'rent' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Mobile Bills', field: 'mobile_phone_bills' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Electricity Bills', field: 'electricity_bills' as keyof SpendingData, prefix: '₹', suffix: '/month' },
    { label: 'Hotels', field: 'hotels_annual' as keyof SpendingData, prefix: '₹', suffix: '/year' },
    { label: 'Flights', field: 'flights_annual' as keyof SpendingData, prefix: '₹', suffix: '/year' },
    { label: 'Health Insurance', field: 'insurance_health_annual' as keyof SpendingData, prefix: '₹', suffix: '/year' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Spending Analysis</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Enter your monthly/annual spending to get personalized credit card recommendations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {spendingCategories.map((category) => (
            <div key={category.field} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {category.label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  {category.prefix}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={spendingData[category.field] || ''}
                  onChange={(e) => handleInputChange(category.field, e.target.value)}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  {category.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Analyze & Recommend
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalysisModal;
