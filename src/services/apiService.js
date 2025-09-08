import axios from 'axios';
import useApiStore from '../stores/apiStore';
import useDashboardStore from '../stores/dashboardStore';

class ApiService {
  constructor() {
    this.axios = axios.create({
      timeout: 10000,
    });
    
    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw this.handleError(error);
      }
    );
  }
  
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      let message = error.response.data?.message || 'API request failed';
      
      // Provide more specific error messages for common issues
      if (error.response.status === 301) {
        message = 'API endpoint has moved. Please check the API configuration.';
      } else if (error.response.status === 403) {
        message = 'Access denied. Please check your API key and permissions.';
      } else if (error.response.status === 429) {
        message = 'Rate limit exceeded. Please wait before making more requests.';
      } else if (error.response.status === 500) {
        message = 'API server error. Please try again later.';
      }
      
      return {
        message,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        status: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
      };
    }
  }
  
  async makeRequest(provider, endpoint, ...args) {
    const apiStore = useApiStore.getState();
    const dashboardStore = useDashboardStore.getState();
    
    // Check if we have cached data
    const cacheKey = `${provider}_${endpoint}_${JSON.stringify(args)}`;
    const cachedData = dashboardStore.getCachedData(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const endpointConfig = apiStore.getEndpoint(provider, endpoint, ...args);
      
      // Create request promise
      const requestPromise = new Promise((resolve, reject) => {
        const request = {
          provider,
          execute: async () => {
            const response = await this.axios.get(endpointConfig.url, {
              params: endpointConfig.params,
            });
            return response.data;
          },
          resolve,
          reject,
        };
        
        // Check rate limit and add to queue if necessary
        if (apiStore.checkRateLimit(provider)) {
          request.execute().then(resolve).catch(reject);
          apiStore.incrementRateLimit(provider);
        } else {
          apiStore.addToQueue(request);
        }
      });
      
      const data = await requestPromise;
      
      // Cache the successful response
      dashboardStore.setCachedData(cacheKey, data, 300000); // 5 minutes
      
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  // Alpha Vantage API methods
  async getQuote(symbol) {
    return this.makeRequest('alphaVantage', 'quote', symbol);
  }
  
  async getIntradayData(symbol, interval = '5min') {
    return this.makeRequest('alphaVantage', 'intraday', symbol, interval);
  }
  
  async getDailyData(symbol) {
    return this.makeRequest('alphaVantage', 'daily', symbol);
  }
  
  async getTopGainersLosers() {
    return this.makeRequest('alphaVantage', 'topGainersLosers');
  }
  
  // Finnhub API methods
  async getFinnhubQuote(symbol) {
    return this.makeRequest('finnhub', 'quote', symbol);
  }
  
  async getCandleData(symbol, resolution = 'D', from, to) {
    if (!from) from = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    if (!to) to = Math.floor(Date.now() / 1000);
    
    return this.makeRequest('finnhub', 'candles', symbol, resolution, from, to);
  }
  
  async getCompanyProfile(symbol) {
    return this.makeRequest('finnhub', 'profile', symbol);
  }
  
  // IndianAPI methods
  async getIndianQuote(symbol, exchange = 'NSE') {
    try {
      // Try with the specified exchange first
      return await this.makeRequest('indianAPI', 'quote', symbol, exchange);
    } catch (error) {
      console.log(`Indian API failed for ${symbol} with exchange ${exchange}:`, error.message);
      
      // If it fails, try without exchange parameter for US stocks
      if (error.status === 0 || error.status === 500 || error.message.includes('Network error') || 
          error.message.includes('Proxy error') || error.message.includes('timeout') ||
          error.message.includes('API server error')) {
        console.log(`Retrying Indian API quote for ${symbol} without exchange parameter`);
        try {
          return await this.makeRequest('indianAPI', 'quote', symbol, null);
        } catch (retryError) {
          console.log(`Indian API completely failed for ${symbol}, falling back to Alpha Vantage`);
          // Fallback to Alpha Vantage if Indian API completely fails
          try {
            return await this.getQuote(symbol);
          } catch (fallbackError) {
            console.error(`All API providers failed for ${symbol}:`, fallbackError);
            throw new Error(`Unable to fetch data for ${symbol} from any API provider. Please try again later.`);
          }
        }
      }
      throw error;
    }
  }
  
  async getIndianHistoricalData(symbol, from_date, to_date, exchange = 'NSE') {
    try {
      return await this.makeRequest('indianAPI', 'historical', symbol, from_date, to_date, exchange);
    } catch (error) {
      // If it fails, try without exchange parameter
      if (error.status === 0 || error.status === 500 || error.message.includes('Network error') ||
          error.message.includes('Proxy error') || error.message.includes('timeout')) {
        console.log(`Retrying Indian API historical data for ${symbol} without exchange parameter`);
        try {
          return await this.makeRequest('indianAPI', 'historical', symbol, from_date, to_date, null);
        } catch (retryError) {
          console.log(`Indian API historical data failed for ${symbol}, falling back to Alpha Vantage`);
          // Fallback to Alpha Vantage daily data
          return await this.getDailyData(symbol);
        }
      }
      throw error;
    }
  }
  
  async getIndianCompanyInfo(symbol, exchange = 'NSE') {
    try {
      return await this.makeRequest('indianAPI', 'companyInfo', symbol, exchange);
    } catch (error) {
      // If it fails, try without exchange parameter
      if (error.status === 0 || error.status === 500 || error.message.includes('Network error') ||
          error.message.includes('Proxy error') || error.message.includes('timeout')) {
        console.log(`Retrying Indian API company info for ${symbol} without exchange parameter`);
        try {
          return await this.makeRequest('indianAPI', 'companyInfo', symbol, null);
        } catch (retryError) {
          console.log(`Indian API company info failed for ${symbol}, falling back to Finnhub`);
          // Fallback to Finnhub company profile
          return await this.getCompanyProfile(symbol);
        }
      }
      throw error;
    }
  }
  
  // Data transformation methods
  transformAlphaVantageQuote(data) {
    const quote = data['Global Quote'];
    if (!quote) return null;
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      latestTradingDay: quote['07. latest trading day'],
    };
  }
  
  transformAlphaVantageTimeSeries(data, type = 'intraday') {
    let timeSeries;
    
    if (type === 'intraday') {
      timeSeries = data['Time Series (5min)'] || data['Time Series (1min)'] || data['Time Series (15min)'] || data['Time Series (30min)'] || data['Time Series (60min)'];
    } else if (type === 'daily') {
      timeSeries = data['Time Series (Daily)'];
    }
    
    if (!timeSeries) return [];
    
    return Object.entries(timeSeries)
      .map(([timestamp, values]) => ({
        timestamp,
        date: new Date(timestamp),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .sort((a, b) => a.date - b.date);
  }
  
  transformFinnhubCandles(data) {
    if (!data.c || data.c.length === 0) return [];
    
    return data.t.map((timestamp, index) => ({
      timestamp: timestamp * 1000,
      date: new Date(timestamp * 1000),
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index],
    }));
  }
  
  transformTopGainersLosers(data) {
    if (!data.top_gainers && !data.top_losers && !data.most_actively_traded) {
      return { gainers: [], losers: [], mostActive: [] };
    }
    
    const transformItem = (item) => ({
      symbol: item.ticker,
      price: parseFloat(item.price),
      change: parseFloat(item.change_amount),
      changePercent: parseFloat(item.change_percentage.replace('%', '')),
      volume: parseInt(item.volume),
    });
    
    return {
      gainers: (data.top_gainers || []).map(transformItem),
      losers: (data.top_losers || []).map(transformItem),
      mostActive: (data.most_actively_traded || []).map(transformItem),
    };
  }
  
  // IndianAPI data transformation methods
  transformIndianQuote(data) {
    if (!data || !data.data) return null;
    
    const quote = data.data;
    return {
      symbol: quote.symbol || quote.ticker,
      price: parseFloat(quote.price || quote.last_price),
      change: parseFloat(quote.change || quote.change_amount),
      changePercent: parseFloat(quote.change_percent || quote.change_percentage),
      volume: parseInt(quote.volume || quote.total_volume),
      previousClose: parseFloat(quote.previous_close),
      open: parseFloat(quote.open || quote.open_price),
      high: parseFloat(quote.high || quote.day_high),
      low: parseFloat(quote.low || quote.day_low),
      latestTradingDay: quote.date || new Date().toISOString().split('T')[0],
    };
  }
  
  transformIndianHistoricalData(data) {
    if (!data || !data.data || !Array.isArray(data.data)) return [];
    
    return data.data.map(item => ({
      timestamp: item.date || item.timestamp,
      date: new Date(item.date || item.timestamp),
      open: parseFloat(item.open || item.open_price),
      high: parseFloat(item.high || item.day_high),
      low: parseFloat(item.low || item.day_low),
      close: parseFloat(item.close || item.last_price),
      volume: parseInt(item.volume || item.total_volume),
    })).sort((a, b) => a.date - b.date);
  }
  
  transformIndianCompanyInfo(data) {
    if (!data || !data.data) return null;
    
    const company = data.data;
    return {
      symbol: company.symbol || company.ticker,
      name: company.name || company.company_name,
      industry: company.industry || company.sector,
      marketCap: company.market_cap,
      description: company.description || company.about,
      website: company.website,
      logo: company.logo,
    };
  }
}

export default new ApiService();

