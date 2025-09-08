import { useEffect } from 'react';
import Head from 'next/head';
import useDashboardStore from '../stores/dashboardStore';

export default function Home() {
  const { widgets, theme } = useDashboardStore();
  
  useEffect(() => {
    // Set initial theme - only in browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);
  
  return (
    <>
      <Head>
        <title>Finance Dashboard - Real-time Financial Data Visualization</title>
        <meta name="description" content="Customizable finance dashboard with real-time data from financial APIs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Dashboard content is rendered by DashboardGrid in Layout */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Finance Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Build your personalized financial monitoring dashboard with real-time data visualization
              </p>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Add Widgets</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click "Add Widget" to create tables, finance cards, or charts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Customize Layout</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop widgets to arrange your perfect dashboard
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Real-time Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect to financial APIs for live stock market data
                  </p>
                </div>
              </div>
            </div>
            
           
          </div>
        </div>
      )}
    </>
  );
}
