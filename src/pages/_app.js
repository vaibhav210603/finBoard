import { useEffect } from 'react';
import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useDashboardStore from '../stores/dashboardStore';

function MyApp({ Component, pageProps }) {
  const { initializeCache } = useDashboardStore();
  
  useEffect(() => {
    // Initialize cache cleanup on app startup
    initializeCache();
  }, [initializeCache]);
  
  return (
    <ErrorBoundary>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ErrorBoundary>
  );
}

export default MyApp;
