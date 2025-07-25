import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { MarketSummary as MarketSummaryType } from '../types/stock';

interface MarketSummaryProps {
  summary: MarketSummaryType;
}

export const MarketSummary: React.FC<MarketSummaryProps> = ({ summary }) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Stocks</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalStocks}</p>
          </div>
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Gainers</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{summary.gainers}</p>
          </div>
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Losers</p>
            <p className="text-lg sm:text-2xl font-bold text-red-600">{summary.losers}</p>
          </div>
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-red-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Volume</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatVolume(summary.totalVolume)}</p>
          </div>
          <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Minus className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};