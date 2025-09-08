// API Configuration - access env vars dynamically
export const getApiConfig = () => ({
  alphaVantage: {
    baseUrl: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL ,
    apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ,
    rateLimit: {
      requests: 5,
      window: 60000, // 1 minute
    },
  },
  finnhub: {
    baseUrl: process.env.NEXT_PUBLIC_FINNHUB_BASE_URL || 'https://finnhub.io/api/v1',
    apiKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '',
    rateLimit: {
      requests: 60,
      window: 60000, // 1 minute
    },
  },
});

// Check if API keys are configured
export const isApiConfigured = () => {
  return !!(API_CONFIG.alphaVantage.apiKey || API_CONFIG.finnhub.apiKey);
};

// Get available providers
export const getAvailableProviders = () => {
  const config = getApiConfig();
  const providers = [];
  
  if (config.alphaVantage.apiKey) {
    providers.push('alphaVantage');
  }
  
  if (config.finnhub.apiKey) {
    providers.push('finnhub');
  }
  
  if (API_CONFIG.indianAPI.apiKey) {
    providers.push('indianAPI');
  }
  
  return providers;
};

// API Provider configurations with their specific requirements
export const API_PROVIDER_CONFIGS = {
  alphaVantage: {
    name: 'Alpha Vantage',
    description: 'Global stock market data and technical indicators',
    endpoints: {
      quote: {
        name: 'Stock Quote',
        description: 'Get real-time stock quote data',
        requiredFields: ['symbol'],
        optionalFields: ['outputsize'],
        defaultParams: { outputsize: 'compact' }
      },
      intraday: {
        name: 'Intraday Data',
        description: 'Get intraday time series data',
        requiredFields: ['symbol', 'interval'],
        optionalFields: ['outputsize'],
        defaultParams: { interval: '5min', outputsize: 'compact' }
      },
      daily: {
        name: 'Daily Data',
        description: 'Get daily time series data',
        requiredFields: ['symbol'],
        optionalFields: ['outputsize'],
        defaultParams: { outputsize: 'compact' }
      },
      topGainersLosers: {
        name: 'Top Gainers/Losers',
        description: 'Get top gaining and losing stocks',
        requiredFields: [],
        optionalFields: [],
        defaultParams: {}
      }
    }
  },
  finnhub: {
    name: 'Finnhub',
    description: 'Real-time financial data and market information',
    endpoints: {
      quote: {
        name: 'Stock Quote',
        description: 'Get real-time stock quote',
        requiredFields: ['symbol'],
        optionalFields: [],
        defaultParams: {}
      },
      candles: {
        name: 'Candlestick Data',
        description: 'Get historical candlestick data',
        requiredFields: ['symbol', 'resolution'],
        optionalFields: ['from', 'to'],
        defaultParams: { resolution: 'D' }
      },
      profile: {
        name: 'Company Profile',
        description: 'Get company profile information',
        requiredFields: ['symbol'],
        optionalFields: [],
        defaultParams: {}
      }
    }
  },
  indianAPI: {
    name: 'Indian API',
    description: 'Indian stock market data and financial information',
    endpoints: {
      quote: {
        name: 'Stock Quote',
        description: 'Get Indian stock quote data',
        requiredFields: ['symbol'],
        optionalFields: ['exchange'],
        defaultParams: { exchange: 'NSE' }
      },
      historical: {
        name: 'Historical Data',
        description: 'Get historical stock data',
        requiredFields: ['symbol', 'from_date', 'to_date'],
        optionalFields: ['exchange'],
        defaultParams: { exchange: 'NSE' }
      },
      companyInfo: {
        name: 'Company Information',
        description: 'Get company information',
        requiredFields: ['symbol'],
        optionalFields: ['exchange'],
        defaultParams: { exchange: 'NSE' }
      }
    }
  }
};

// Default symbols for demo purposes
export const DEFAULT_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
  'META', 'NVDA', 'NFLX', 'AMD', 'INTC'
];

// Sample data for when APIs are not configured
export const SAMPLE_DATA = {
  quote: {
    symbol: 'DEMO',
    price: 150.25,
    change: 2.15,
    changePercent: 1.45,
    volume: 1234567,
    previousClose: 148.10,
    open: 149.80,
    high: 151.20,
    low: 148.95,
    latestTradingDay: new Date().toISOString().split('T')[0],
  },
  timeSeries: Array.from({ length: 50 }, (_, i) => ({
    timestamp: new Date(Date.now() - (49 - i) * 60 * 60 * 1000).toISOString(),
    date: new Date(Date.now() - (49 - i) * 60 * 60 * 1000),
    open: 148 + Math.random() * 6,
    high: 149 + Math.random() * 6,
    low: 147 + Math.random() * 6,
    close: 148 + Math.random() * 6,
    volume: Math.floor(Math.random() * 1000000) + 500000,
  })),
  topGainers: {
    gainers: [
      { symbol: 'DEMO1', price: 125.50, change: 8.25, changePercent: 7.03, volume: 2500000 },
      { symbol: 'DEMO2', price: 89.75, change: 5.50, changePercent: 6.53, volume: 1800000 },
      { symbol: 'DEMO3', price: 234.80, change: 12.30, changePercent: 5.53, volume: 950000 },
    ],
    losers: [
      { symbol: 'DEMO4', price: 45.25, change: -3.75, changePercent: -7.65, volume: 3200000 },
      { symbol: 'DEMO5', price: 167.90, change: -8.10, changePercent: -4.60, volume: 1100000 },
    ],
    mostActive: [
      { symbol: 'DEMO6', price: 78.40, change: 1.20, changePercent: 1.55, volume: 8500000 },
      { symbol: 'DEMO7', price: 156.70, change: -2.30, changePercent: -1.45, volume: 7200000 },
    ],
  },
};

