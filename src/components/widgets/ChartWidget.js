import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import BaseWidget from './BaseWidget';
import apiService from '../../services/apiService';
import useDashboardStore from '../../stores/dashboardStore';
import { CHART_TYPES } from '../../stores/dashboardStore';

const ChartWidget = ({ widget }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(widget.config?.timeframe || '1D');
  
  const { updateWidget } = useDashboardStore();
  
  const symbol = widget.config?.symbol || 'AAPL';
  const chartType = widget.config?.chartType || CHART_TYPES.LINE;
  const showVolume = widget.config?.showVolume || false;
  
  const timeframeOptions = [
    { value: '1D', label: '1D', interval: '5min' },
    { value: '5D', label: '5D', interval: '15min' },
    { value: '1M', label: '1M', interval: '60min' },
    { value: '3M', label: '3M', interval: 'daily' },
    { value: '1Y', label: '1Y', interval: 'daily' },
  ];
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let chartData = [];
      const selectedTimeframe = timeframeOptions.find(t => t.value === timeframe);
      const provider = widget.config?.provider || 'alphaVantage';
      const endpoint = widget.config?.endpoint || 'intraday';
      
      if (!selectedTimeframe) {
        throw new Error('Invalid timeframe selected');
      }
      
      // Fetch data based on provider and endpoint
      if (provider === 'alphaVantage') {
        if (endpoint === 'daily' || selectedTimeframe.interval === 'daily') {
          const response = await apiService.getDailyData(symbol);
          chartData = apiService.transformAlphaVantageTimeSeries(response, 'daily');
        } else {
          const response = await apiService.getIntradayData(symbol, selectedTimeframe.interval);
          chartData = apiService.transformAlphaVantageTimeSeries(response, 'intraday');
        }
      } else if (provider === 'finnhub') {
        if (endpoint === 'candles') {
          const from = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
          const to = Math.floor(Date.now() / 1000);
          const resolution = selectedTimeframe.interval === 'daily' ? 'D' : '5';
          const response = await apiService.getCandleData(symbol, resolution, from, to);
          chartData = apiService.transformFinnhubCandles(response);
        }
      } else if (provider === 'indianAPI') {
        if (endpoint === 'historical') {
          const toDate = new Date().toISOString().split('T')[0];
          const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const exchange = widget.config?.exchange || 'NSE';
          const response = await apiService.getIndianHistoricalData(symbol, fromDate, toDate, exchange);
          chartData = apiService.transformIndianHistoricalData(response);
        }
      }
      
      // Ensure chartData is an array
      if (!Array.isArray(chartData)) {
        chartData = [];
      }
      
      // Limit data based on timeframe
      let filteredData = [...chartData];
      const now = new Date();
      
      switch (timeframe) {
        case '1D':
          filteredData = chartData.filter(d => 
            d.date >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
          );
          break;
        case '5D':
          filteredData = chartData.filter(d => 
            d.date >= new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
          );
          break;
        case '1M':
          filteredData = chartData.filter(d => 
            d.date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          );
          break;
        case '3M':
          filteredData = chartData.filter(d => 
            d.date >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          );
          break;
        case '1Y':
          filteredData = chartData.filter(d => 
            d.date >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          );
          break;
      }
      
      // Filter out any invalid data points
      const validData = filteredData.filter(d => 
        d && 
        typeof d.close === 'number' && 
        !isNaN(d.close) && 
        d.date instanceof Date
      );
      
      setData(validData.slice(-200)); // Limit to last 200 points for performance
      updateWidget(widget.id, { lastUpdated: new Date().toISOString() });
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange, updateWidget]);
  
  useEffect(() => {
    // Add a small delay to prevent immediate execution
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [symbol, timeframe, widget.id, widget.config?.provider, widget.config?.endpoint, widget.config?.exchange]); // Use specific dependencies
  
  const chartStats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    try {
      const prices = data.map(d => d.close).filter(price => typeof price === 'number' && !isNaN(price));
      
      if (prices.length === 0) return null;
      
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = lastPrice - firstPrice;
      const changePercent = firstPrice !== 0 ? (change / firstPrice) * 100 : 0;
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      
      return {
        current: lastPrice,
        change,
        changePercent,
        high,
        low,
        isPositive: change >= 0,
      };
    } catch (error) {
      console.error('Error calculating chart stats:', error);
      return null;
    }
  }, [data]);
  
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === '1D') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {new Date(label).toLocaleString()}
          </p>
          <div className="space-y-1">
            {chartType === CHART_TYPES.CANDLESTICK ? (
              <>
                <p className="text-sm"><span className="text-gray-500">Open:</span> {formatPrice(data.open)}</p>
                <p className="text-sm"><span className="text-gray-500">High:</span> {formatPrice(data.high)}</p>
                <p className="text-sm"><span className="text-gray-500">Low:</span> {formatPrice(data.low)}</p>
                <p className="text-sm"><span className="text-gray-500">Close:</span> {formatPrice(data.close)}</p>
              </>
            ) : (
              <p className="text-sm font-medium">
                Price: {formatPrice(payload[0].value)}
              </p>
            )}
            {showVolume && (
              <p className="text-sm">
                <span className="text-gray-500">Volume:</span> {data.volume?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p className="text-sm">No chart data available</p>
        </div>
      );
    }
    
    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };
    
    const commonElements = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="timestamp"
          tickFormatter={formatDate}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis 
          domain={['dataMin - 1', 'dataMax + 1']}
          tickFormatter={formatPrice}
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
      </>
    );
    
    switch (chartType) {
      case CHART_TYPES.LINE:
        return (
          <LineChart {...chartProps}>
            {commonElements}
            <Line
              type="monotone"
              dataKey="close"
              stroke={chartStats?.isPositive ? "#22C55E" : "#EF4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        );
        
      case CHART_TYPES.BAR:
        return (
          <BarChart {...chartProps}>
            {commonElements}
            <Bar
              dataKey="close"
              fill={chartStats?.isPositive ? "#22C55E" : "#EF4444"}
              opacity={0.8}
            />
          </BarChart>
        );
        
      case CHART_TYPES.CANDLESTICK:
      default:
        // Simplified candlestick using area chart
        return (
          <AreaChart {...chartProps}>
            {commonElements}
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartStats?.isPositive ? "#22C55E" : "#EF4444"}
              fill={chartStats?.isPositive ? "#22C55E" : "#EF4444"}
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <ReferenceLine 
              y={data[0]?.close} 
              stroke="#6B7280" 
              strokeDasharray="2 2" 
              opacity={0.5}
            />
          </AreaChart>
        );
    }
  };
  
  return (
    <BaseWidget
      widget={widget}
      onRefresh={fetchData}
      isLoading={loading}
      error={error}
    >
      <div className="space-y-4">
        {/* Chart Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {symbol}
            </h4>
            {chartStats && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                chartStats.isPositive ? 'text-success-600' : 'text-danger-600'
              }`}>
                {chartStats.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {chartStats.changePercent.toFixed(2)}%
              </div>
            )}
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  timeframe === option.value
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Price Stats */}
        {chartStats && (
          <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
              <div className="font-semibold">{formatPrice(chartStats.current)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Change</div>
              <div className={`font-semibold ${
                chartStats.isPositive ? 'text-success-600' : 'text-danger-600'
              }`}>
                {chartStats.isPositive ? '+' : ''}{formatPrice(chartStats.change)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">High</div>
              <div className="font-semibold">{formatPrice(chartStats.high)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Low</div>
              <div className="font-semibold">{formatPrice(chartStats.low)}</div>
            </div>
          </div>
        )}
        
        {/* Chart */}
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p className="text-sm">Loading chart data...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <p className="text-sm text-danger-500 mb-2">Failed to load chart data</p>
                  <button 
                    onClick={fetchData}
                    className="text-xs text-primary-600 hover:text-primary-700 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <p className="text-sm">No chart data available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};

export default ChartWidget;
