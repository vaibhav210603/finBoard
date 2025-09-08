import { useState, useEffect } from 'react';
import useDashboardStore from '../../stores/dashboardStore';

export default function CacheManager({ isOpen, onClose }) {
  const { 
    getCacheStats, 
    clearCache, 
    clearExpiredCache, 
    clearCacheByProvider,
    dataCache,
    cacheExpiry 
  } = useDashboardStore();
  
  const [cacheStats, setCacheStats] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('all');

  useEffect(() => {
    if (isOpen) {
      updateCacheStats();
    }
  }, [isOpen, dataCache, cacheExpiry]);

  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const getTimeUntilExpiry = (expiry) => {
    if (!expiry) return 'No expiry';
    const now = Date.now();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClearCache = () => {
    if (selectedProvider === 'all') {
      clearCache();
    } else {
      clearCacheByProvider(selectedProvider);
    }
    updateCacheStats();
  };

  const handleClearExpired = () => {
    clearExpiredCache();
    updateCacheStats();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Cache Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Cache Statistics */}
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {cacheStats.totalEntries}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Total Entries</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {cacheStats.activeEntries}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">Active Entries</div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {cacheStats.expiredEntries}
                </div>
                <div className="text-sm text-red-800 dark:text-red-200">Expired Entries</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatBytes(cacheStats.totalSize)}
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-200">Total Size</div>
              </div>
            </div>
          )}

          {/* Provider Statistics */}
          {cacheStats && cacheStats.providerStats && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Cache by Provider
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(cacheStats.providerStats).map(([provider, count]) => (
                  <div key={provider} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {provider}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {count} entries
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cache Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Cache Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Providers</option>
                <option value="alphaVantage">Alpha Vantage</option>
                <option value="finnhub">Finnhub</option>
                <option value="indianAPI">Indian API</option>
              </select>
              
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear Cache
              </button>
              
              <button
                onClick={handleClearExpired}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Clear Expired
              </button>
              
              <button
                onClick={updateCacheStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Stats
              </button>
            </div>
          </div>

          {/* Cache Entries List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Cache Entries
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {Object.entries(dataCache).map(([key, item]) => {
                      const expiry = cacheExpiry[key];
                      const isExpired = expiry && Date.now() > expiry;
                      const metadata = item && typeof item === 'object' ? item : null;
                      
                      return (
                        <tr key={key} className={isExpired ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                            {key.length > 30 ? `${key.substring(0, 30)}...` : key}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {metadata?.provider || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {metadata?.endpoint || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {formatTime(metadata?.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {getTimeUntilExpiry(expiry)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isExpired 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
