export interface StockData {
  symbol: string;
  company: string;
  sector: string;
  ldcp: number; // Last Day Closing Price
  open: number;
  high: number;
  low: number;
  current: number;
  change: number;
  changePercent: number;
  volume: number;
  isPositive: boolean;
}

export interface MarketSummary {
  totalStocks: number;
  gainers: number;
  losers: number;
  unchanged: number;
  totalVolume: number;
}

export interface StockTimeSeriesData {
  symbol: string;
  company: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  high52Week?: number;
  low52Week?: number;
  historicalData: HistoricalDataPoint[];
  chartData: ChartDataPoint[];
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
  timestamp: number;
}

export type ChartTimeInterval = '1min' | '5min' | '15min' | '30min' | '1hour' | '1day';
