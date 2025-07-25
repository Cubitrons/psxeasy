import React from 'react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartDataPoint, ChartTimeInterval } from '../types/stock';
import { Clock } from 'lucide-react';

interface StockChartProps {
  data: ChartDataPoint[];
  symbol: string;
  isPositive: boolean;
  onIntervalChange: (interval: ChartTimeInterval) => void;
}

const CHART_INTERVALS = [
  { value: '1min' as ChartTimeInterval, label: '1m' },
  { value: '5min' as ChartTimeInterval, label: '5m' },
  { value: '15min' as ChartTimeInterval, label: '15m' },
  { value: '30min' as ChartTimeInterval, label: '30m' },
  { value: '1hour' as ChartTimeInterval, label: '1h' },
  { value: '1day' as ChartTimeInterval, label: '1D' },
];

export const StockChart: React.FC<StockChartProps> = ({ data, symbol, isPositive, onIntervalChange }) => {
  const [selectedInterval, setSelectedInterval] = useState<ChartTimeInterval>('1min');

  const handleIntervalChange = (interval: ChartTimeInterval) => {
    setSelectedInterval(interval);
    onIntervalChange(interval);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (selectedInterval === '1day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  const formatPrice = (value: number) => {
    return `PKR ${value.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {selectedInterval === '1day' ? formatDate(label) : new Date(label).toLocaleString()}
          </p>
          <p className="text-blue-600">
            Price: {formatPrice(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-gray-600">
              Volume: {formatVolume(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No chart data available</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {symbol} Price Chart
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Interactive price movement and volume data
            </p>
          </div>
          
          {/* Time Interval Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div className="flex space-x-1 min-w-max">
              {CHART_INTERVALS.map((interval) => (
                <button
                  key={interval.value}
                  onClick={() => handleIntervalChange(interval.value)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedInterval === interval.value
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Price Chart */}
        <div>
          <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-4">
            Price Movement ({CHART_INTERVALS.find(i => i.value === selectedInterval)?.label || selectedInterval})
          </h4>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={isPositive ? "#10b981" : "#ef4444"} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={isPositive ? "#10b981" : "#ef4444"} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toFixed(2)}
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Chart */}
        <div>
          <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-4">
            Trading Volume ({CHART_INTERVALS.find(i => i.value === selectedInterval)?.label || selectedInterval})
          </h4>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatVolume}
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [formatVolume(value), 'Volume']}
                  labelFormatter={(label) => selectedInterval === '1day' ? formatDate(label) : new Date(label).toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};