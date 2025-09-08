import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Eye, Activity, DollarSign, BarChart3 } from 'lucide-react';
import BaseWidget from './BaseWidget';
import apiService from '../../services/apiService';
import useDashboardStore from '../../stores/dashboardStore';
import { FINANCE_CARD_TYPES } from '../../stores/dashboardStore';

const FinanceCardWidget = ({ widget }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { updateWidget } = useDashboardStore();
  
  const cardType = widget.config?.cardType || FINANCE_CARD_TYPES.WATCHLIST;
  const symbols = widget.config?.symbols || ['AAPL', 'GOOGL', 'MSFT'];
  const displayLimit = widget.config?.displayLimit || 5;
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      const provider = widget.config?.provider || 'alphaVantage';
      const endpoint = widget.config?.endpoint || 'quote';
      
      switch (cardType) {
        case FINANCE_CARD_TYPES.MARKET_GAINERS:
          if (provider === 'alphaVantage') {
            const gainersData = await apiService.getTopGainersLosers();
            const transformed = apiService.transformTopGainersLosers(gainersData);
            result = transformed.gainers.slice(0, displayLimit);
          } else {
            // For other providers, we'll use the symbols as a fallback
            result = [];
          }
          break;
          
        case FINANCE_CARD_TYPES.WATCHLIST:
        case FINANCE_CARD_TYPES.PERFORMANCE:
        case FINANCE_CARD_TYPES.FINANCIAL_DATA:
        default:
          const quotes = await Promise.allSettled(
            symbols.slice(0, displayLimit).map(async (symbol) => {
              try {
                let quote, transformedQuote;
                
                if (provider === 'alphaVantage') {
                  quote = await apiService.getQuote(symbol);
                  transformedQuote = apiService.transformAlphaVantageQuote(quote);
                } else if (provider === 'finnhub') {
                  quote = await apiService.getFinnhubQuote(symbol);
                  transformedQuote = {
                    symbol: symbol,
                    price: quote.c || 0,
                    change: quote.d || 0,
                    changePercent: quote.dp || 0,
                    volume: quote.v || 0,
                    previousClose: quote.pc || 0,
                    open: quote.o || 0,
                    high: quote.h || 0,
                    low: quote.l || 0,
                    latestTradingDay: new Date().toISOString().split('T')[0],
                  };
                } else if (provider === 'indianAPI') {
                  const exchange = widget.config?.exchange || 'NSE';
                  quote = await apiService.getIndianQuote(symbol, exchange);
                  transformedQuote = apiService.transformIndianQuote(quote);
                }
                
                return transformedQuote;
              } catch (err) {
                console.warn(`Failed to fetch ${symbol}:`, err);
                return null;
              }
            })
          );
          
          result = quotes
            .filter(q => q.status === 'fulfilled' && q.value)
            .map(q => q.value);
          break;
      }
      
      setData(result);
      updateWidget(widget.id, { lastUpdated: new Date().toISOString() });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [cardType, symbols, displayLimit, widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange, updateWidget]);
  
  useEffect(() => {
    // Add a small delay to prevent immediate execution
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [cardType, symbols.join(','), displayLimit, widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange, fetchData]); // Include fetchData in dependencies
  
  const formatCurrency = (value) => {
    // Handle undefined, null, or non-numeric values
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    const numValue = Number(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };
  
  const formatPercent = (value) => {
    // Handle undefined, null, or non-numeric values
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    const numValue = Number(value);
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };
  
  const formatVolume = (value) => {
    // Handle undefined, null, or non-numeric values
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    const numValue = Number(value);
    if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(1)}B`;
    if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(1)}M`;
    if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(1)}K`;
    return numValue.toString();
  };
  
  const getCardIcon = () => {
    switch (cardType) {
      case FINANCE_CARD_TYPES.WATCHLIST:
        return <Eye className="w-5 h-5" />;
      case FINANCE_CARD_TYPES.MARKET_GAINERS:
        return <TrendingUp className="w-5 h-5" />;
      case FINANCE_CARD_TYPES.PERFORMANCE:
        return <BarChart3 className="w-5 h-5" />;
      case FINANCE_CARD_TYPES.FINANCIAL_DATA:
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };
  
  const getCardTitle = () => {
    switch (cardType) {
      case FINANCE_CARD_TYPES.WATCHLIST:
        return 'Watchlist';
      case FINANCE_CARD_TYPES.MARKET_GAINERS:
        return 'Top Gainers';
      case FINANCE_CARD_TYPES.PERFORMANCE:
        return 'Performance';
      case FINANCE_CARD_TYPES.FINANCIAL_DATA:
        return 'Financial Data';
      default:
        return 'Finance Card';
    }
  };
  
  const renderCard = (item, index) => {
    const isPositive = item.changePercent >= 0;
    
    return (
      <div
        key={item.symbol || index}
        className="metric-card hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {item.symbol}
            </h4>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger-500" />
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(item.price)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className={`font-medium ${
            isPositive ? 'text-success-600' : 'text-danger-600'
          }`}>
            {formatPercent(item.changePercent)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Vol: {formatVolume(item.volume)}
          </div>
        </div>
        
        {cardType === FINANCE_CARD_TYPES.FINANCIAL_DATA && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Open:</span>
                <span className="ml-1 font-medium">{formatCurrency(item.open)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">High:</span>
                <span className="ml-1 font-medium">{formatCurrency(item.high)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Low:</span>
                <span className="ml-1 font-medium">{formatCurrency(item.low)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Prev:</span>
                <span className="ml-1 font-medium">{formatCurrency(item.previousClose)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderSummaryCard = () => {
    if (data.length === 0) return null;
    
    const totalValue = data.reduce((sum, item) => sum + item.price, 0);
    const avgChange = data.reduce((sum, item) => sum + item.changePercent, 0) / data.length;
    const gainers = data.filter(item => item.changePercent > 0).length;
    const losers = data.filter(item => item.changePercent < 0).length;
    
    return (
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          {getCardIcon()}
          <h3 className="font-semibold text-primary-700 dark:text-primary-300">
            {getCardTitle()} Summary
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Total Value</div>
            <div className="font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Avg Change</div>
            <div className={`font-bold ${
              avgChange >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              {formatPercent(avgChange)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Gainers</div>
            <div className="font-bold text-success-600">{gainers}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Losers</div>
            <div className="font-bold text-danger-600">{losers}</div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <BaseWidget
      widget={widget}
      onRefresh={fetchData}
      isLoading={loading}
      error={error}
    >
      <div className="space-y-3">
        {widget.config?.showSummary && renderSummaryCard()}
        
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((item, index) => renderCard(item, index))}
          </div>
        ) : !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default FinanceCardWidget;
