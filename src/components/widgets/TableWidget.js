import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import BaseWidget from './BaseWidget';
import apiService from '../../services/apiService';
import useDashboardStore from '../../stores/dashboardStore';

const TableWidget = ({ widget }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const { updateWidget } = useDashboardStore();
  
  const itemsPerPage = widget.config?.itemsPerPage || 10;
  const symbols = widget.config?.symbols || ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  
  const fetchData = useCallback(async () => {
    if (!symbols.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = widget.config?.provider || 'alphaVantage';
      const endpoint = widget.config?.endpoint || 'quote';
      
      const quotes = await Promise.allSettled(
        symbols.map(async (symbol) => {
          try {
            let quote, transformedQuote;
            
            if (provider === 'alphaVantage') {
              quote = await apiService.getQuote(symbol);
              transformedQuote = apiService.transformAlphaVantageQuote(quote);
            } else if (provider === 'finnhub') {
              quote = await apiService.getFinnhubQuote(symbol);
              transformedQuote = {
                symbol: symbol,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                volume: quote.v,
                previousClose: quote.pc,
                open: quote.o,
                high: quote.h,
                low: quote.l,
                latestTradingDay: new Date().toISOString().split('T')[0],
              };
            } else if (provider === 'indianAPI') {
              const exchange = widget.config?.exchange || 'NSE';
              
              // Check if this is a US stock being requested from Indian API
              const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
              if (usStocks.includes(symbol.toUpperCase())) {
                console.warn(`Warning: ${symbol} is a US stock but Indian API is selected. This may cause issues.`);
              }
              
              try {
                quote = await apiService.getIndianQuote(symbol, exchange);
                transformedQuote = apiService.transformIndianQuote(quote);
              } catch (indianError) {
                console.warn(`Indian API failed for ${symbol}, attempting fallback to Alpha Vantage`);
                // Fallback to Alpha Vantage
                quote = await apiService.getQuote(symbol);
                transformedQuote = apiService.transformAlphaVantageQuote(quote);
              }
            }
            
            return transformedQuote;
          } catch (err) {
            console.warn(`Failed to fetch ${symbol}:`, err);
            return null;
          }
        })
      );
      
      const validQuotes = quotes
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
      
      setData(validQuotes);
      updateWidget(widget.id, { lastUpdated: new Date().toISOString() });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [symbols, widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange, updateWidget]);
  
  useEffect(() => {
    // Add a small delay to prevent immediate execution
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [symbols.join(','), widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange]); // Use specific dependencies instead of fetchData
  
  // Filter and search data
  useEffect(() => {
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [data, searchTerm, sortConfig]);
  
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-500" />
      : <ChevronDown className="w-4 h-4 text-primary-500" />;
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  const formatVolume = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  return (
    <BaseWidget
      widget={widget}
      onRefresh={fetchData}
      isLoading={loading}
      error={error}
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th 
                  className="text-left py-2 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    Symbol
                    {getSortIcon('symbol')}
                  </div>
                </th>
                <th 
                  className="text-right py-2 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price
                    {getSortIcon('price')}
                  </div>
                </th>
                <th 
                  className="text-right py-2 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Change
                    {getSortIcon('change')}
                  </div>
                </th>
                <th 
                  className="text-right py-2 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('changePercent')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Change %
                    {getSortIcon('changePercent')}
                  </div>
                </th>
                <th 
                  className="text-right py-2 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Volume
                    {getSortIcon('volume')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr 
                  key={item.symbol} 
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-2 px-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.symbol}
                    </div>
                  </td>
                  <td className="py-2 px-1 text-right font-medium">
                    {formatCurrency(item.price)}
                  </td>
                  <td className={`py-2 px-1 text-right font-medium ${
                    item.change >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {item.change >= 0 ? '+' : ''}{formatCurrency(item.change)}
                  </td>
                  <td className={`py-2 px-1 text-right font-medium ${
                    item.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {formatPercent(item.changePercent)}
                  </td>
                  <td className="py-2 px-1 text-right text-gray-600 dark:text-gray-400">
                    {formatVolume(item.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {currentData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No matching results found' : 'No data available'}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default TableWidget;
