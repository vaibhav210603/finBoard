import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import ErrorBoundary from '../components/common/ErrorBoundary';

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ErrorBoundary>
  );
}

export default MyApp;
