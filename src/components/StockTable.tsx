import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { StockData } from '../types/stock';

interface StockTableProps {
  stocks: StockData[];
  onStockClick: (symbol: string) => void;
}

type SortField = keyof StockData;
type SortDirection = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({ stocks, onStockClick }) => {
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks.filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [stocks, sortField, sortDirection, searchTerm]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Market Watch</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        {/* Sort Options for Mobile */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Sort by:</span>
            <div className="flex space-x-4">
              {[
                { field: 'current' as SortField, label: 'Price' },
                { field: 'change' as SortField, label: 'Change' },
                { field: 'changePercent' as SortField, label: 'Change %' },
                { field: 'volume' as SortField, label: 'Volume' }
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`text-xs font-medium whitespace-nowrap transition-colors ${
                    sortField === field
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    <SortIcon field={field} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Cards */}
        <div className="divide-y divide-gray-100">
          {filteredAndSortedStocks.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => onStockClick(stock.symbol)}
              className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      stock.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.isPositive ? 
                        <TrendingUp className="w-4 h-4" /> : 
                        <TrendingDown className="w-4 h-4" />
                      }
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate" title={stock.company}>
                    {stock.company}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {formatNumber(stock.current)}
                  </div>
                  <div className={`text-sm font-medium ${
                    stock.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.isPositive ? '+' : ''}{formatNumber(stock.change)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Change %</span>
                  <span className={`font-medium ${
                    stock.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.isPositive ? '+' : ''}{formatNumber(stock.changePercent)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">High/Low</span>
                  <span className="font-medium">
                    <span className="text-green-600">{formatNumber(stock.high)}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-red-600">{formatNumber(stock.low)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Volume</span>
                  <span className="font-medium text-gray-900">
                    {formatVolume(stock.volume)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-1">
                  <span>Symbol</span>
                  <SortIcon field="symbol" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('current')}
              >
                <div className="flex items-center space-x-1">
                  <span>Current</span>
                  <SortIcon field="current" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center space-x-1">
                  <span>Change</span>
                  <SortIcon field="change" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('changePercent')}
              >
                <div className="flex items-center space-x-1">
                  <span>Change %</span>
                  <SortIcon field="changePercent" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('high')}
              >
                <div className="flex items-center space-x-1">
                  <span>High</span>
                  <SortIcon field="high" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('low')}
              >
                <div className="flex items-center space-x-1">
                  <span>Low</span>
                  <SortIcon field="low" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center space-x-1">
                  <span>Volume</span>
                  <SortIcon field="volume" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedStocks.map((stock, index) => (
              <tr 
                key={stock.symbol} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onStockClick(stock.symbol)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs" title={stock.company}>
                      {stock.company}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatNumber(stock.current)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    stock.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.isPositive ? 
                      <TrendingUp className="w-4 h-4" /> : 
                      <TrendingDown className="w-4 h-4" />
                    }
                    <span>{stock.isPositive ? '+' : ''}{formatNumber(stock.change)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    stock.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.isPositive ? '+' : ''}{formatNumber(stock.changePercent)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(stock.high)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(stock.low)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatVolume(stock.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedStocks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No stocks found matching your search.</p>
        </div>
      )}
    </div>
  );
};