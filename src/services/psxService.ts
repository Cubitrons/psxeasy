import { StockData, MarketSummary, StockTimeSeriesData, HistoricalDataPoint, ChartDataPoint, ChartTimeInterval } from '../types/stock';

const PSX_API_URL = 'https://dps.psx.com.pk/market-watch';
const PSX_TIMESERIES_URL = 'https://dps.psx.com.pk/timeseries/int/';

// Multiple CORS proxy options for better reliability
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
];

export class PSXService {
  static async fetchMarketData(): Promise<StockData[]> {
    // Try multiple CORS proxies for better reliability
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = `${CORS_PROXIES[i]}${encodeURIComponent(PSX_API_URL)}`;
        console.log(`Attempting to fetch from proxy ${i + 1}:`, CORS_PROXIES[i]);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        const parsedData = this.parseHTMLData(html);
        
        if (parsedData.length > 0) {
          console.log(`Successfully fetched data using proxy ${i + 1}`);
          return parsedData;
        } else {
          throw new Error('No data found in response');
        }
      } catch (error) {
        console.warn(`Proxy ${i + 1} failed:`, error);
        
        // If this is the last proxy, return mock data
        if (i === CORS_PROXIES.length - 1) {
          console.error('All CORS proxies failed, using mock data');
          return this.getMockData();
        }
      }
    }
    
    // Fallback to mock data
    return this.getMockData();
  }

  static async fetchStockTimeSeries(symbol: string, interval: ChartTimeInterval = '1min'): Promise<StockTimeSeriesData> {
    // Try multiple CORS proxies for time series data
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const proxyUrl = `${CORS_PROXIES[i]}${encodeURIComponent(PSX_TIMESERIES_URL + symbol)}`;
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json,text/plain,*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        const chartData = this.parseJSONChartData(jsonData, symbol, interval);
        
        return {
          symbol,
          company: `${symbol} Company Limited`,
          sector: 'ALLSHR',
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          chartData,
          historicalData: []
        };
      } catch (error) {
        console.warn(`Time series proxy ${i + 1} failed:`, error);
        
        if (i === CORS_PROXIES.length - 1) {
          console.error('All time series proxies failed, using mock data');
        }
      }
    }
    
    // Fallback to mock data
    return {
      symbol,
      company: `${symbol} Company Limited`,
      sector: 'ALLSHR',
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      chartData: this.generateMockChartData(interval),
      historicalData: []
    };
  }

  static buildStockTimeSeriesFromMarketData(marketStock: StockData, chartData: ChartDataPoint[]): StockTimeSeriesData {
    return {
      symbol: marketStock.symbol,
      company: marketStock.company,
      sector: marketStock.sector,
      currentPrice: marketStock.current,
      change: marketStock.change,
      changePercent: marketStock.changePercent,
      volume: marketStock.volume,
      marketCap: Math.random() * 10000000000, // Mock data for demo
      peRatio: Math.random() * 30 + 5,
      dividendYield: Math.random() * 8,
      high52Week: marketStock.current * (1 + Math.random() * 0.5),
      low52Week: marketStock.current * (1 - Math.random() * 0.3),
      historicalData: this.generateMockHistoricalData(),
      chartData
    };
  }

  private static parseJSONChartData(jsonData: any, symbol: string, interval: ChartTimeInterval): ChartDataPoint[] {
    try {
      // Check if the response has the expected structure
      if (jsonData && jsonData.status === 1 && jsonData.data && Array.isArray(jsonData.data)) {
        const chartData: ChartDataPoint[] = [];
        
        // Process the data array - each item is [timestamp, price, volume]
        jsonData.data.forEach((item: any[]) => {
          if (Array.isArray(item) && item.length >= 3) {
            const timestamp = item[0]; // Unix timestamp
            const price = parseFloat(item[1]) || 0;
            const volume = parseInt(item[2]) || 0;
            
            // Convert timestamp to date string with time for intraday intervals
            const dateObj = new Date(timestamp * 1000);
            const date = interval === '1day' 
              ? dateObj.toISOString().split('T')[0]
              : dateObj.toISOString();
            
            chartData.push({
              date,
              price,
              volume,
              timestamp: timestamp * 1000 // Convert to milliseconds
            });
          }
        });
        
        // Sort by timestamp (oldest first) and limit to reasonable number of points
        chartData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Aggregate data based on the selected interval
        const aggregatedData = this.aggregateDataByInterval(chartData, interval);
        
        // Return appropriate amount of data based on interval
        const dataLimit = this.getDataLimitForInterval(interval);
        return aggregatedData.slice(-dataLimit);
      }
    } catch (error) {
      console.warn('Error parsing JSON chart data:', error);
    }
    
    // Fallback to mock data
    return this.generateMockChartData(interval);
  }

  private static getDataLimitForInterval(interval: ChartTimeInterval): number {
    switch (interval) {
      case '1min': return 390; // 6.5 hours of trading
      case '5min': return 390; // ~32 hours of data
      case '15min': return 390; // ~4 days of data
      case '30min': return 390; // ~8 days of data
      case '1hour': return 390; // ~16 days of data
      case '1day': return 30; // 30 days
      default: return 390;
    }
  }

  private static aggregateDataByInterval(chartData: ChartDataPoint[], interval: ChartTimeInterval): ChartDataPoint[] {
    if (interval === '1min') {
      // For 1min, return raw data (no aggregation needed)
      return chartData;
    }

    const intervalMinutes = this.getIntervalMinutes(interval);
    const aggregatedMap = new Map<string, {
      key: string;
      prices: number[];
      volumes: number[];
      timestamp: number;
    }>();
    
    // Group data by time interval
    chartData.forEach(point => {
      const key = this.getIntervalKey(point.timestamp, interval, intervalMinutes);
      
      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          key,
          prices: [],
          volumes: [],
          timestamp: point.timestamp
        });
      }
      
      const intervalData = aggregatedMap.get(key)!;
      intervalData.prices.push(point.price);
      intervalData.volumes.push(point.volume);
      
      // Keep the earliest timestamp for the interval
      if (point.timestamp < intervalData.timestamp) {
        intervalData.timestamp = point.timestamp;
      }
    });
    
    // Convert to aggregated data points
    const aggregatedData: ChartDataPoint[] = [];
    aggregatedMap.forEach(intervalData => {
      const avgPrice = intervalData.prices.reduce((sum, price) => sum + price, 0) / intervalData.prices.length;
      const totalVolume = intervalData.volumes.reduce((sum, vol) => sum + vol, 0);
      
      const dateObj = new Date(intervalData.timestamp);
      const date = interval === '1day' 
        ? dateObj.toISOString().split('T')[0]
        : dateObj.toISOString();

      aggregatedData.push({
        date,
        price: parseFloat(avgPrice.toFixed(2)),
        volume: totalVolume,
        timestamp: intervalData.timestamp
      });
    });
    
    return aggregatedData.sort((a, b) => a.timestamp - b.timestamp);
  }

  private static getIntervalMinutes(interval: ChartTimeInterval): number {
    switch (interval) {
      case '1min': return 1;
      case '5min': return 5;
      case '15min': return 15;
      case '30min': return 30;
      case '1hour': return 60;
      case '1day': return 1440; // 24 * 60
      default: return 1;
    }
  }

  private static getIntervalKey(timestamp: number, interval: ChartTimeInterval, intervalMinutes: number): string {
    const date = new Date(timestamp);
    
    if (interval === '1day') {
      return date.toISOString().split('T')[0];
    }
    
    // For intraday intervals, round down to the nearest interval
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes;
    
    date.setMinutes(roundedMinutes, 0, 0); // Set seconds and milliseconds to 0
    
    return date.toISOString();
  }

  private static parseTimeSeriesData(html: string, symbol: string): StockTimeSeriesData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract basic stock info from the page
    const companyNameElement = doc.querySelector('.company-name, h1, .stock-title');
    const company = companyNameElement?.textContent?.trim() || `${symbol} Company`;
    
    // Extract current price and change info
    const priceElement = doc.querySelector('.current-price, .price, [data-price]');
    const currentPrice = parseFloat(priceElement?.textContent?.replace(/[^\d.-]/g, '') || '0');
    
    const changeElement = doc.querySelector('.change, .price-change');
    const changeText = changeElement?.textContent?.trim() || '0';
    const change = parseFloat(changeText.replace(/[^\d.-]/g, ''));
    const changePercent = change !== 0 ? (change / (currentPrice - change)) * 100 : 0;
    
    // Extract volume
    const volumeElement = doc.querySelector('.volume, [data-volume]');
    const volume = parseInt(volumeElement?.textContent?.replace(/[^\d]/g, '') || '0');
    
    // Parse historical data from tables or scripts
    const historicalData = this.parseHistoricalData(doc);
    
    // Parse chart data from JavaScript variables or JSON
    const chartData = this.parseChartData(html, symbol);
    
    return {
      symbol,
      company,
      sector: 'ALLSHR', // Default sector
      currentPrice,
      change,
      changePercent,
      volume,
      historicalData,
      chartData
    };
  }

  private static parseChartData(html: string, symbol: string): ChartDataPoint[] {
    // Look for chart data in JavaScript variables
    const chartDataRegex = /chartData\s*=\s*(\[.*?\])/s;
    const priceDataRegex = /priceData\s*=\s*(\[.*?\])/s;
    const timeSeriesRegex = /timeSeries\s*=\s*(\[.*?\])/s;
    
    let chartData: ChartDataPoint[] = [];
    
    try {
      // Try to extract chart data from various possible JavaScript variables
      let match = html.match(chartDataRegex) || html.match(priceDataRegex) || html.match(timeSeriesRegex);
      
      if (match) {
        const data = JSON.parse(match[1]);
        chartData = data.map((item: any, index: number) => {
          // Handle different possible data formats
          if (Array.isArray(item)) {
            // Format: [timestamp, price, volume]
            return {
              date: new Date(item[0]).toISOString().split('T')[0],
              price: parseFloat(item[1]) || 0,
              volume: parseInt(item[2]) || 0,
              timestamp: item[0]
            };
          } else if (typeof item === 'object') {
            // Format: {date, price, volume} or similar
            return {
              date: item.date || item.x || new Date().toISOString().split('T')[0],
              price: parseFloat(item.price || item.y || item.close) || 0,
              volume: parseInt(item.volume) || 0,
              timestamp: new Date(item.date || item.x).getTime()
            };
          }
          return null;
        }).filter(Boolean);
      }
    } catch (error) {
      console.warn('Error parsing chart data:', error);
    }
    
    // If no chart data found, generate mock data
    if (chartData.length === 0) {
      chartData = this.generateMockChartData();
    }
    
    return chartData;
  }

  private static generateMockChartData(interval: ChartTimeInterval = '1min'): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    let basePrice = 100 + Math.random() * 50;
    const intervalMinutes = this.getIntervalMinutes(interval);
    const dataPoints = this.getDataLimitForInterval(interval);
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date(today);
      
      if (interval === '1day') {
        date.setDate(date.getDate() - i);
      } else {
        date.setMinutes(date.getMinutes() - (i * intervalMinutes));
      }
      
      const volatility = 0.03; // 3% daily volatility
      const change = (Math.random() - 0.5) * volatility * basePrice;
      const price = Math.max(basePrice + change, 1); // Ensure price doesn't go below 1
      const volume = Math.floor(Math.random() * 1000000);
      
      const dateStr = interval === '1day' 
        ? date.toISOString().split('T')[0]
        : date.toISOString();

      data.push({
        date: dateStr,
        price: parseFloat(price.toFixed(2)),
        volume,
        timestamp: date.getTime()
      });
      
      basePrice = price;
    }
    
    return data;
  }

  private static parseHistoricalData(doc: Document): HistoricalDataPoint[] {
    const historicalData: HistoricalDataPoint[] = [];
    
    // Look for table rows with historical data
    const rows = doc.querySelectorAll('table tr, .historical-data tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        try {
          const date = cells[0].textContent?.trim() || '';
          const open = parseFloat(cells[1].textContent?.replace(/[^\d.-]/g, '') || '0');
          const high = parseFloat(cells[2].textContent?.replace(/[^\d.-]/g, '') || '0');
          const low = parseFloat(cells[3].textContent?.replace(/[^\d.-]/g, '') || '0');
          const close = parseFloat(cells[4].textContent?.replace(/[^\d.-]/g, '') || '0');
          const volume = parseInt(cells[5].textContent?.replace(/[^\d]/g, '') || '0');
          
          if (date && open && high && low && close) {
            historicalData.push({ date, open, high, low, close, volume });
          }
        } catch (error) {
          console.warn('Error parsing historical data row:', error);
        }
      }
    });
    
    return historicalData.length > 0 ? historicalData : this.generateMockHistoricalData();
  }

  private static getMockTimeSeriesData(symbol: string): StockTimeSeriesData {
    const mockData = this.getMockData().find(stock => stock.symbol === symbol);
    
    if (mockData) {
      return {
        symbol: mockData.symbol,
        company: mockData.company,
        sector: mockData.sector,
        currentPrice: mockData.current,
        change: mockData.change,
        changePercent: mockData.changePercent,
        volume: mockData.volume,
        marketCap: Math.random() * 10000000000, // Random market cap for demo
        peRatio: Math.random() * 30 + 5,
        dividendYield: Math.random() * 8,
        high52Week: mockData.current * (1 + Math.random() * 0.5),
        low52Week: mockData.current * (1 - Math.random() * 0.3),
        historicalData: this.generateMockHistoricalData(),
        chartData: this.generateMockChartData()
      };
    }
    
    return {
      symbol,
      company: `${symbol} Company Limited`,
      sector: 'ALLSHR',
      currentPrice: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 20,
      volume: Math.floor(Math.random() * 1000000),
      historicalData: this.generateMockHistoricalData(),
      chartData: this.generateMockChartData()
    };
  }

  private static generateMockHistoricalData(): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const today = new Date();
    let basePrice = 100 + Math.random() * 50;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const volatility = 0.05; // 5% daily volatility
      const change = (Math.random() - 0.5) * volatility * basePrice;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 1000000);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });
      
      basePrice = close;
    }
    
    return data;
  }

  private static parseHTMLData(html: string): StockData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr');
    const stocks: StockData[] = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 10) {
        try {
          const symbolElement = cells[0].querySelector('strong');
          const companyElement = cells[0].querySelector('a');
          
          if (symbolElement && companyElement) {
            const symbol = symbolElement.textContent?.trim() || '';
            const company = companyElement.getAttribute('data-title') || '';
            const sector = cells[2].textContent?.trim() || '';
            
            const ldcp = parseFloat(cells[3].getAttribute('data-order') || '0');
            const open = parseFloat(cells[4].getAttribute('data-order') || '0');
            const high = parseFloat(cells[5].getAttribute('data-order') || '0');
            const low = parseFloat(cells[6].getAttribute('data-order') || '0');
            const current = parseFloat(cells[7].getAttribute('data-order') || '0');
            const change = parseFloat(cells[8].getAttribute('data-order') || '0');
            const changePercent = parseFloat(cells[9].getAttribute('data-order') || '0');
            const volume = parseInt(cells[10].getAttribute('data-order') || '0');
            
            const isPositive = change >= 0;

            stocks.push({
              symbol,
              company,
              sector,
              ldcp,
              open,
              high,
              low,
              current,
              change,
              changePercent,
              volume,
              isPositive
            });
          }
        } catch (error) {
          console.warn('Error parsing row:', error);
        }
      }
    });

    return stocks;
  }

  private static getMockData(): StockData[] {
    return [
      {
        symbol: 'DFSM',
        company: 'Dewan Farooque Spinning Mills Limited',
        sector: 'ALLSHR,KMIALLSHR',
        ldcp: 8.18,
        open: 8.65,
        high: 8.69,
        low: 7.35,
        current: 7.50,
        change: -0.68,
        changePercent: -8.31,
        volume: 24127221,
        isPositive: false
      },
      {
        symbol: 'WTL',
        company: 'Worldcall Telecom Limited',
        sector: 'ALLSHR',
        ldcp: 1.49,
        open: 1.49,
        high: 1.52,
        low: 1.45,
        current: 1.47,
        change: -0.02,
        changePercent: -1.34,
        volume: 19758898,
        isPositive: false
      },
      {
        symbol: 'GGL',
        company: 'Ghani Global Holdings Limited',
        sector: 'ALLSHR,KMIALLSHR',
        ldcp: 19.51,
        open: 19.89,
        high: 20.94,
        low: 19.62,
        current: 20.64,
        change: 1.13,
        changePercent: 5.79,
        volume: 16285249,
        isPositive: true
      },
      {
        symbol: 'BOP',
        company: 'The Bank of Punjab',
        sector: 'ALLSHR,KSE100,KSE100PR,PSXDIV20',
        ldcp: 12.74,
        open: 12.80,
        high: 12.80,
        low: 12.53,
        current: 12.69,
        change: -0.05,
        changePercent: -0.39,
        volume: 14937494,
        isPositive: false
      },
      {
        symbol: 'AKBL',
        company: 'Askari Bank Limited',
        sector: 'ALLSHR,KSE100,KSE100PR,PSXDIV20',
        ldcp: 67.55,
        open: 67.50,
        high: 69.40,
        low: 66.80,
        current: 68.16,
        change: 0.61,
        changePercent: 0.90,
        volume: 12818237,
        isPositive: true
      }
    ];
  }

  static calculateMarketSummary(stocks: StockData[]): MarketSummary {
    const gainers = stocks.filter(stock => stock.change > 0).length;
    const losers = stocks.filter(stock => stock.change < 0).length;
    const unchanged = stocks.filter(stock => stock.change === 0).length;
    const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);

    return {
      totalStocks: stocks.length,
      gainers,
      losers,
      unchanged,
      totalVolume
    };
  }
}