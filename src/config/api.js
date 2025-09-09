// API Configuration - access env vars dynamically
export const getApiConfig = () => ({
  alphaVantage: {
    baseUrl: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL ,
    apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ,
    rateLimit: {
      requests: 5,
      window: 60000, 
    },
  },
  finnhub: {
    baseUrl: process.env.NEXT_PUBLIC_FINNHUB_BASE_URL ,
    apiKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY ,
    rateLimit: {
      requests: 60,
      window: 60000, 
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


