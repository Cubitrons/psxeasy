import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, DollarSign, Percent, Calendar } from 'lucide-react';
import { StockTimeSeriesData, StockData, ChartTimeInterval } from '../types/stock';
import { PSXService } from '../services/psxService';
import { LoadingSpinner } from './LoadingSpinner';
import { StockChart } from './StockChart';

interface StockDetailProps {
  symbol: string;
  marketData: StockData[];
  onBack: () => void;
}

export const StockDetail: React.FC<StockDetailProps> = ({ symbol, marketData, onBack }) => {
  const [stockData, setStockData] = useState<StockTimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartInterval, setChartInterval] = useState<ChartTimeInterval>('1min');
  const [chartLoading, setChartLoading] = useState(false);

  const fetchStockData = async (interval: ChartTimeInterval = '1min') => {
    try {
      setChartLoading(true);
      setError(null);
      
      // Find the stock in market data
      const marketStock = marketData.find(stock => stock.symbol === symbol);
      
      if (!marketStock) {
        throw new Error('Stock not found in market data');
      }
      
      // Fetch chart data from the timeseries endpoint with the selected interval
      const timeSeriesData = await PSXService.fetchStockTimeSeries(symbol, interval);
      
      // Combine market data with chart data
      const combinedData = PSXService.buildStockTimeSeriesFromMarketData(
        marketStock, 
        timeSeriesData.chartData
      );
      
      setStockData(combinedData);
    } catch (err) {
      setError('Failed to fetch stock details. Please try again.');
      console.error('Error fetching stock data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Find the stock in market data
        const marketStock = marketData.find(stock => stock.symbol === symbol);
        
        if (!marketStock) {
          throw new Error('Stock not found in market data');
        }
        
        // Fetch chart data from the timeseries endpoint with default interval
        const timeSeriesData = await PSXService.fetchStockTimeSeries(symbol, chartInterval);
        
        // Combine market data with chart data
        const combinedData = PSXService.buildStockTimeSeriesFromMarketData(
          marketStock, 
          timeSeriesData.chartData
        );
        
        setStockData(combinedData);
      } catch (err) {
        setError('Failed to fetch stock details. Please try again.');
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [symbol, marketData, chartInterval]);

  const handleIntervalChange = (interval: ChartTimeInterval) => {
    setChartInterval(interval);
    fetchStockData(interval);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

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

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `PKR ${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `PKR ${(amount / 1000000).toFixed(1)}M`;
    }
    return `PKR ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Market Watch
          </button>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Market Watch
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Stock data not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="mb-4 sm:mb-6 inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Market Watch
          </button>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{stockData.symbol}</h1>
                <p className="text-base sm:text-lg text-gray-600 mb-4 line-clamp-2">{stockData.company}</p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className="text-2xl sm:text-4xl font-bold text-gray-900">
                    PKR {formatNumber(stockData.currentPrice)}
                  </span>
                  <div className={`flex items-center space-x-1 text-base sm:text-lg font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? 
                      <TrendingUp className="w-5 h-5" /> : 
                      <TrendingDown className="w-5 h-5" />
                    }
                    <span>{isPositive ? '+' : ''}{formatNumber(stockData.change)}</span>
                    <span>({isPositive ? '+' : ''}{formatNumber(stockData.changePercent)}%)</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 lg:mt-0">
                <div className="text-xs sm:text-sm text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Volume</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatVolume(stockData.volume)}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {stockData.marketCap && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Market Cap</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(stockData.marketCap)}</p>
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {stockData.peRatio && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">P/E Ratio</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatNumber(stockData.peRatio)}</p>
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Percent className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          {stockData.dividendYield && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Dividend Yield</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatNumber(stockData.dividendYield)}%</p>
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 52 Week Range */}
        {(stockData.high52Week || stockData.low52Week) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">52 Week Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stockData.low52Week && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">52 Week Low</p>
                  <p className="text-xl font-bold text-red-600">PKR {formatNumber(stockData.low52Week)}</p>
                </div>
              )}
              {stockData.high52Week && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">52 Week High</p>
                  <p className="text-xl font-bold text-green-600">PKR {formatNumber(stockData.high52Week)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historical Data */}
        {stockData.chartData.length > 0 && (
          <div className="mb-6 sm:mb-8">
            {chartLoading && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-4 border-gray-200"></div>
                    <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <span className="ml-3 text-gray-600">Loading chart data...</span>
                </div>
              </div>
            )}
            {!chartLoading && (
              <StockChart 
                data={stockData.chartData} 
                symbol={stockData.symbol}
                isPositive={isPositive}
                onIntervalChange={handleIntervalChange}
              />
            )}
          </div>
        )}

        {stockData.historicalData.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Historical Data (Last 30 Days)</h3>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockData.historicalData.slice(0, 15).map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors active:bg-gray-100">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {new Date(data.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(data.open)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(data.high)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(data.low)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(data.close)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatVolume(data.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};