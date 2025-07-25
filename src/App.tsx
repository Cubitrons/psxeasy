import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, AlertCircle } from 'lucide-react';
import { StockData, MarketSummary as MarketSummaryType } from './types/stock';
import { PSXService } from './services/psxService';
import { MarketSummary } from './components/MarketSummary';
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PSXService.fetchMarketData();
      setStocks(data);
      setMarketSummary(PSXService.calculateMarketSummary(data));
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch market data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleStockClick = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const handleBackToMarket = () => {
    setSelectedStock(null);
  };

  // If a stock is selected, show the detail view
  if (selectedStock) {
    return <StockDetail symbol={selectedStock} marketData={stocks} onBack={handleBackToMarket} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">PSX Market Watch</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">Pakistan Stock Exchange Live Data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {lastUpdated && (
                <div className="text-xs sm:text-sm text-gray-500 hidden md:block">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm sm:text-base text-red-800">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {marketSummary && <MarketSummary summary={marketSummary} />}
            <StockTable stocks={stocks} onStockClick={handleStockClick} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            <p>Data sourced from Pakistan Stock Exchange (PSX)</p>
            <p className="mt-1">This application is for educational purposes only. Please verify data independently before making investment decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;