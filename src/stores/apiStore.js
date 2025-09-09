import { create } from 'zustand';

const useApiStore = create((set, get) => ({
  // API configuration - access env vars dynamically
  getApiKeys: () => {
    const alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const indianAPIKey = process.env.NEXT_PUBLIC_INDIAN_API_KEY;
    
    
    return {
      alphaVantage: alphaVantageKey,
      finnhub: finnhubKey,
      indianAPI: indianAPIKey,
    };
  },
  
  getBaseUrls: () => {
    const alphaVantageUrl = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL;
    const finnhubUrl = process.env.NEXT_PUBLIC_FINNHUB_BASE_URL;
    const indianAPIUrl = process.env.NEXT_PUBLIC_INDIAN_API_BASE_URL;
    
    return {
      alphaVantage: alphaVantageUrl,
      finnhub: finnhubUrl,
      indianAPI: indianAPIUrl,
    };
  },
  
  // Rate limiting
  rateLimits: {
    alphaVantage: { requests: 5, window: 60000, lastReset: Date.now(), count: 0 },
    finnhub: { requests: 60, window: 60000, lastReset: Date.now(), count: 0 },
    indianAPI: { requests: 100, window: 60000, lastReset: Date.now(), count: 0 },
  },
  
  // Request queue
  requestQueue: [],
  isProcessingQueue: false,
  
  
  checkRateLimit: (provider) => {
    const { rateLimits } = get();
    const limit = rateLimits[provider];
    
    if (!limit) return true;
    
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - limit.lastReset > limit.window) {
      set((state) => ({
        rateLimits: {
          ...state.rateLimits,
          [provider]: {
            ...limit,
            count: 0,
            lastReset: now,
          },
        },
      }));
      return true;
    }
    
    const isWithinLimit = limit.count < limit.requests;
    
    // If rate limit is exceeded, redirect to API limit page
    if (!isWithinLimit && typeof window !== 'undefined') {
      // Check if we're already on the API limit page to avoid infinite redirects
      if (window.location.pathname !== '/api-limit-exceeded') {
        window.location.href = '/api-limit-exceeded';
      }
    }
    
    return isWithinLimit;
  },
  
  incrementRateLimit: (provider) => {
    set((state) => ({
      rateLimits: {
        ...state.rateLimits,
        [provider]: {
          ...state.rateLimits[provider],
          count: state.rateLimits[provider].count + 1,
        },
      },
    }));
  },
  
  addToQueue: (request) => {
    set((state) => ({
      requestQueue: [...state.requestQueue, request],
    }));
    
    get().processQueue();
  },
  
  processQueue: async () => {
    const { requestQueue, isProcessingQueue } = get();
    
    if (isProcessingQueue || requestQueue.length === 0) {
      return;
    }
    
    set({ isProcessingQueue: true });
    
    while (requestQueue.length > 0) {
      const request = requestQueue[0];
      
      if (get().checkRateLimit(request.provider)) {
        // Process the request
        try {
          const result = await request.execute();
          request.resolve(result);
          get().incrementRateLimit(request.provider);
        } catch (error) {
          request.reject(error);
        }
        
        // Remove processed request
        set((state) => ({
          requestQueue: state.requestQueue.slice(1),
        }));
      } else {
        // Wait for rate limit to reset
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    set({ isProcessingQueue: false });
  },
  
  // API endpoints configuration
  endpoints: {
    alphaVantage: {
      quote: (symbol) => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        const apiKey = apiKeys.alphaVantage;
        //console.log('Alpha Vantage API Key being used:', apiKey);
        return {
          url: baseUrls.alphaVantage,
          params: {
            function: 'GLOBAL_QUOTE',
            symbol,
            apikey: apiKey,
          },
        };
      },
      intraday: (symbol, interval = '5min') => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        return {
          url: baseUrls.alphaVantage,
          params: {
            function: 'TIME_SERIES_INTRADAY',
            symbol,
            interval,
            apikey: apiKeys.alphaVantage,
          },
        };
      },
      daily: (symbol) => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        return {
          url: baseUrls.alphaVantage,
          params: {
            function: 'TIME_SERIES_DAILY',
            symbol,
            apikey: apiKeys.alphaVantage,
          },
        };
      },
      topGainersLosers: () => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        return {
          url: baseUrls.alphaVantage,
          params: {
            function: 'TOP_GAINERS_LOSERS',
            apikey: apiKeys.alphaVantage,
          },
        };
      },
    },
    finnhub: {
      quote: (symbol) => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        console.log('Finnhub API Key being used:', apiKeys.finnhub);
        return {
          url: `${baseUrls.finnhub}/quote`,
          params: {
            symbol,
            token: apiKeys.finnhub,
          },
        };
      },
      candles: (symbol, resolution, from, to) => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        return {
          url: `${baseUrls.finnhub}/stock/candle`,
          params: {
            symbol,
            resolution,
            from,
            to,
            token: apiKeys.finnhub,
          },
        };
      },
      profile: (symbol) => {
        const apiKeys = get().getApiKeys();
        const baseUrls = get().getBaseUrls();
        return {
          url: `${baseUrls.finnhub}/stock/profile2`,
          params: {
            symbol,
            token: apiKeys.finnhub,
          },
        };
      },
    },
    indianAPI: {
      quote: (symbol, exchange = 'NSE') => {
        // Check if this is a US stock (common US symbols)
        const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
        const isUSStock = usStocks.includes(symbol.toUpperCase());
        
        if (isUSStock) {
          // Redirect US stocks to Alpha Vantage (silent redirect)
          return get().endpoints.alphaVantage.quote(symbol);
        }
        
        // Use our proxy endpoint to avoid CORS issues
        const apiKeys = get().getApiKeys();
        const params = {
          symbol,
          api_key: apiKeys.indianAPI,
          endpoint: 'quote',
        };
        
        // Only add exchange parameter for Indian stocks
        if (exchange && (exchange === 'NSE' || exchange === 'BSE')) {
          params.exchange = exchange;
        }
        
        return {
          url: '/api/proxy/indian-api', // Use our proxy endpoint
          params,
        };
      },
      historical: (symbol, from_date, to_date, exchange = 'NSE') => {
        const apiKeys = get().getApiKeys();
        const params = {
          symbol,
          from_date,
          to_date,
          api_key: apiKeys.indianAPI,
          endpoint: 'historical',
        };
        
        if (exchange && (exchange === 'NSE' || exchange === 'BSE')) {
          params.exchange = exchange;
        }
        
        return {
          url: '/api/proxy/indian-api', // Use our proxy endpoint
          params,
        };
      },
      companyInfo: (symbol, exchange = 'NSE') => {
        const apiKeys = get().getApiKeys();
        const params = {
          symbol,
          api_key: apiKeys.indianAPI,
          endpoint: 'company',
        };
        
        if (exchange && (exchange === 'NSE' || exchange === 'BSE')) {
          params.exchange = exchange;
        }
        
        return {
          url: '/api/proxy/indian-api', // Use our proxy endpoint
          params,
        };
      },
    },
  },
  
  // Utility functions
  getEndpoint: (provider, endpoint, ...args) => {
    const endpoints = get().endpoints[provider];
    if (endpoints && endpoints[endpoint]) {
      return endpoints[endpoint](...args);
    }
    throw new Error(`Endpoint ${endpoint} not found for provider ${provider}`);
  },
}));

export default useApiStore;

