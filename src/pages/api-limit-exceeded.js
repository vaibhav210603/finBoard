import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import useApiStore from '../stores/apiStore';

export default function ApiLimitExceeded() {
  const [rateLimits, setRateLimits] = useState({});
  const [nextResetTimes, setNextResetTimes] = useState({});
  const { rateLimits: apiRateLimits } = useApiStore();

  useEffect(() => {
    // Update rate limits from store
    setRateLimits(apiRateLimits);
    
    // Calculate next reset times
    const resetTimes = {};
    Object.entries(apiRateLimits).forEach(([provider, limit]) => {
      if (limit) {
        const timeUntilReset = limit.window - (Date.now() - limit.lastReset);
        resetTimes[provider] = new Date(Date.now() + timeUntilReset);
      }
    });
    setNextResetTimes(resetTimes);

    // Update every second
    const interval = setInterval(() => {
      setRateLimits(apiRateLimits);
      const newResetTimes = {};
      Object.entries(apiRateLimits).forEach(([provider, limit]) => {
        if (limit) {
          const timeUntilReset = limit.window - (Date.now() - limit.lastReset);
          newResetTimes[provider] = new Date(Date.now() + timeUntilReset);
        }
      });
      setNextResetTimes(newResetTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [apiRateLimits]);

  const formatTimeRemaining = (resetTime) => {
    if (!resetTime) return 'Unknown';
    
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Reset now';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProviderDisplayName = (provider) => {
    const names = {
      alphaVantage: 'Alpha Vantage',
      finnhub: 'Finnhub',
      indianAPI: 'Indian API'
    };
    return names[provider] || provider;
  };

  const getProviderDescription = (provider) => {
    const descriptions = {
      alphaVantage: 'Global stock market data and technical indicators',
      finnhub: 'Real-time financial data and market information',
      indianAPI: 'Indian stock market data and financial information'
    };
    return descriptions[provider] || '';
  };

  const isLimitExceeded = (provider) => {
    const limit = rateLimits[provider];
    if (!limit) return false;
    
    const now = Date.now();
    const timeSinceReset = now - limit.lastReset;
    
    // If window has passed, limit is not exceeded
    if (timeSinceReset > limit.window) return false;
    
    return limit.count >= limit.requests;
  };

  const getUsagePercentage = (provider) => {
    const limit = rateLimits[provider];
    if (!limit) return 0;
    
    const now = Date.now();
    const timeSinceReset = now - limit.lastReset;
    
    // If window has passed, usage is 0
    if (timeSinceReset > limit.window) return 0;
    
    return Math.round((limit.count / limit.requests) * 100);
  };

  const exceededProviders = Object.keys(rateLimits).filter(isLimitExceeded);
  const allProvidersExceeded = exceededProviders.length === Object.keys(rateLimits).length;

  return (
    <>
      <Head>
        <title>API Limit Exceeded - Finance Dashboard</title>
        <meta name="description" content="API rate limits have been exceeded. Please wait for limits to reset." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              API Rate Limits Exceeded
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {allProvidersExceeded 
                ? "All API providers have reached their rate limits. Please wait for the limits to reset before making new requests."
                : "Some API providers have reached their rate limits. You can still use other providers or wait for limits to reset."
              }
            </p>
          </div>

          {/* API Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(rateLimits).map(([provider, limit]) => {
              const exceeded = isLimitExceeded(provider);
              const usagePercentage = getUsagePercentage(provider);
              const resetTime = nextResetTimes[provider];
              
              return (
                <div 
                  key={provider}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
                    exceeded 
                      ? 'border-red-200 dark:border-red-800' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {getProviderDisplayName(provider)}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exceeded 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {exceeded ? 'Limit Exceeded' : 'Available'}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {getProviderDescription(provider)}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Usage</span>
                        <span>{limit?.count || 0} / {limit?.requests || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            exceeded ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {exceeded && resetTime && (
                      <div className="text-sm">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">Resets in:</div>
                        <div className="font-mono text-lg font-semibold text-red-600 dark:text-red-400">
                          {formatTimeRemaining(resetTime)}
                        </div>
                      </div>
                    )}
                    
                    {!exceeded && limit && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Window: {limit.window / 1000}s</div>
                        <div>Next reset: {formatTimeRemaining(resetTime)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What can you do?
              </h3>
              <div className="text-blue-800 dark:text-blue-200 space-y-2">
                <p>• Wait for the rate limits to reset (usually 1 minute)</p>
                <p>• Use cached data that's already available</p>
                <p>• Try using different API providers if available</p>
                <p>• Consider upgrading your API plan for higher limits</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Rate limits help ensure fair usage and API stability. 
              Limits typically reset every minute.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
