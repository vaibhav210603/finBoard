import { useState } from 'react';
import { X, Plus, Table, BarChart3, CreditCard, Globe, Database, TrendingUp } from 'lucide-react';
import useDashboardStore, { WIDGET_TYPES, CHART_TYPES, FINANCE_CARD_TYPES } from '../../stores/dashboardStore';
import { API_PROVIDER_CONFIGS } from '../../config/api';

const AddWidgetModal = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [config, setConfig] = useState({});
  const [title, setTitle] = useState('');
  
  const { addWidget } = useDashboardStore();
  
  if (!isOpen) return null;
  
  const widgetTypes = [
    {
      type: WIDGET_TYPES.TABLE,
      icon: Table,
      title: 'Stock Table',
      description: 'A paginated table with stock data, filters, and search',
      defaultConfig: {
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
        itemsPerPage: 10,
      },
      defaultSize: { w: 600, h: 400 },
    },
    {
      type: WIDGET_TYPES.FINANCE_CARD,
      icon: CreditCard,
      title: 'Finance Cards',
      description: 'Cards showing watchlist, gainers, or financial data',
      defaultConfig: {
        cardType: FINANCE_CARD_TYPES.WATCHLIST,
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        displayLimit: 5,
        showSummary: true,
      },
      defaultSize: { w: 300, h: 400 },
    },
    {
      type: WIDGET_TYPES.CHART,
      icon: BarChart3,
      title: 'Stock Chart',
      description: 'Interactive charts showing price movements over time',
      defaultConfig: {
        symbol: 'AAPL',
        chartType: CHART_TYPES.LINE,
        timeframe: '1D',
        showVolume: false,
      },
      defaultSize: { w: 500, h: 350 },
    },
  ];

  const providerIcons = {
    alphaVantage: Globe,
    finnhub: Database,
    indianAPI: TrendingUp,
  };
  
  const handleTypeSelect = (widgetType) => {
    setSelectedType(widgetType);
    setConfig(widgetType.defaultConfig);
    setTitle(widgetType.title);
    setSelectedProvider('');
    setSelectedEndpoint('');
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectedEndpoint('');
    setConfig(prev => ({ ...prev, provider }));
  };

  const handleEndpointSelect = (endpoint) => {
    setSelectedEndpoint(endpoint);
    const endpointConfig = API_PROVIDER_CONFIGS[selectedProvider]?.endpoints[endpoint];
    if (endpointConfig) {
      setConfig(prev => ({ 
        ...prev, 
        endpoint,
        ...endpointConfig.defaultParams 
      }));
    }
  };
  
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedType || !selectedProvider || !selectedEndpoint) return;
    
    const widgetConfig = {
      type: selectedType.type,
      title: title || selectedType.title,
      config: {
        ...config,
        provider: selectedProvider,
        endpoint: selectedEndpoint,
      },
      defaultWidth: selectedType.defaultSize.w,
      defaultHeight: selectedType.defaultSize.h,
      minWidth: 2,
      minHeight: 2,
    };
    
    addWidget(widgetConfig);
    
    // Reset form
    setSelectedType(null);
    setSelectedProvider('');
    setSelectedEndpoint('');
    setConfig({});
    setTitle('');
    onClose();
  };
  
  const renderProviderSelection = () => {
    if (!selectedType) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Provider
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(API_PROVIDER_CONFIGS).map(([key, provider]) => {
              const Icon = providerIcons[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleProviderSelect(key)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedProvider === key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <Icon className="w-6 h-6 text-primary-500 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {provider.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {provider.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => handleEndpointSelect(e.target.value)}
              className="input-field"
            >
              <option value="">Select an endpoint</option>
              {Object.entries(API_PROVIDER_CONFIGS[selectedProvider].endpoints).map(([key, endpoint]) => (
                <option key={key} value={key}>
                  {endpoint.name} - {endpoint.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderDynamicInputFields = () => {
    if (!selectedProvider || !selectedEndpoint) return null;

    const endpointConfig = API_PROVIDER_CONFIGS[selectedProvider]?.endpoints[selectedEndpoint];
    if (!endpointConfig) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          API Parameters
        </h4>
        
        {/* Required Fields */}
        {endpointConfig.requiredFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} *
            </label>
            {field === 'symbol' ? (
              <input
                type="text"
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value.toUpperCase())}
                className="input-field"
                placeholder="e.g., AAPL, GOOGL"
                required
              />
            ) : field === 'interval' ? (
              <select
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select interval</option>
                <option value="1min">1 Minute</option>
                <option value="5min">5 Minutes</option>
                <option value="15min">15 Minutes</option>
                <option value="30min">30 Minutes</option>
                <option value="60min">1 Hour</option>
              </select>
            ) : field === 'resolution' ? (
              <select
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select resolution</option>
                <option value="1">1 Minute</option>
                <option value="5">5 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="D">Daily</option>
                <option value="W">Weekly</option>
                <option value="M">Monthly</option>
              </select>
            ) : field === 'exchange' ? (
              <select
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select exchange</option>
                <option value="NSE">NSE (National Stock Exchange)</option>
                <option value="BSE">BSE (Bombay Stock Exchange)</option>
              </select>
            ) : field === 'from_date' || field === 'to_date' ? (
              <input
                type="date"
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
                required
              />
            ) : (
              <input
                type="text"
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
                required
              />
            )}
          </div>
        ))}

        {/* Optional Fields */}
        {endpointConfig.optionalFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
            </label>
            {field === 'outputsize' ? (
              <select
                value={config[field] || 'compact'}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
              >
                <option value="compact">Compact (100 data points)</option>
                <option value="full">Full (20+ years of data)</option>
              </select>
            ) : field === 'from' || field === 'to' ? (
              <input
                type="datetime-local"
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
              />
            ) : (
              <input
                type="text"
                value={config[field] || ''}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="input-field"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderConfigForm = () => {
    if (!selectedType) return null;
    
    switch (selectedType.type) {
      case WIDGET_TYPES.TABLE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Symbols (comma-separated)
              </label>
              <input
                type="text"
                value={config.symbols?.join(', ') || ''}
                onChange={(e) => handleConfigChange('symbols', 
                  e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                )}
                className="input-field"
                placeholder="AAPL, GOOGL, MSFT, AMZN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items per Page
              </label>
              <select
                value={config.itemsPerPage || 10}
                onChange={(e) => handleConfigChange('itemsPerPage', parseInt(e.target.value))}
                className="input-field"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        );
        
      case WIDGET_TYPES.FINANCE_CARD:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Type
              </label>
              <select
                value={config.cardType || FINANCE_CARD_TYPES.WATCHLIST}
                onChange={(e) => handleConfigChange('cardType', e.target.value)}
                className="input-field"
              >
                <option value={FINANCE_CARD_TYPES.WATCHLIST}>Watchlist</option>
                <option value={FINANCE_CARD_TYPES.MARKET_GAINERS}>Market Gainers</option>
                <option value={FINANCE_CARD_TYPES.PERFORMANCE}>Performance</option>
                <option value={FINANCE_CARD_TYPES.FINANCIAL_DATA}>Financial Data</option>
              </select>
            </div>
            
            {config.cardType !== FINANCE_CARD_TYPES.MARKET_GAINERS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Symbols (comma-separated)
                </label>
                <input
                  type="text"
                  value={config.symbols?.join(', ') || ''}
                  onChange={(e) => handleConfigChange('symbols', 
                    e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  )}
                  className="input-field"
                  placeholder="AAPL, GOOGL, MSFT"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Limit
              </label>
              <select
                value={config.displayLimit || 5}
                onChange={(e) => handleConfigChange('displayLimit', parseInt(e.target.value))}
                className="input-field"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showSummary"
                checked={config.showSummary || false}
                onChange={(e) => handleConfigChange('showSummary', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showSummary" className="text-sm text-gray-700 dark:text-gray-300">
                Show Summary Card
              </label>
            </div>
          </div>
        );
        
      case WIDGET_TYPES.CHART:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                value={config.symbol || ''}
                onChange={(e) => handleConfigChange('symbol', e.target.value.toUpperCase())}
                className="input-field"
                placeholder="AAPL"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Type
              </label>
              <select
                value={config.chartType || CHART_TYPES.LINE}
                onChange={(e) => handleConfigChange('chartType', e.target.value)}
                className="input-field"
              >
                <option value={CHART_TYPES.LINE}>Line Chart</option>
                <option value={CHART_TYPES.BAR}>Bar Chart</option>
                <option value={CHART_TYPES.CANDLESTICK}>Area Chart</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Timeframe
              </label>
              <select
                value={config.timeframe || '1D'}
                onChange={(e) => handleConfigChange('timeframe', e.target.value)}
                className="input-field"
              >
                <option value="1D">1 Day</option>
                <option value="5D">5 Days</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="1Y">1 Year</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showVolume"
                checked={config.showVolume || false}
                onChange={(e) => handleConfigChange('showVolume', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showVolume" className="text-sm text-gray-700 dark:text-gray-300">
                Show Volume in Tooltip
              </label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Add New Widget
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!selectedType ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Choose Widget Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {widgetTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.type}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                    >
                      <Icon className="w-8 h-8 text-primary-500 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {type.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <selectedType.icon className="w-6 h-6 text-primary-500" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {selectedType.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedType.description}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Widget Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder={selectedType.title}
                />
              </div>
              
              {renderProviderSelection()}
              {renderDynamicInputFields()}
              {renderConfigForm()}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary ${!selectedProvider || !selectedEndpoint ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedProvider || !selectedEndpoint}
                  >
                    <Plus className="w-4 h-4" />
                    Add Widget
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddWidgetModal;

