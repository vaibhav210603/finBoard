import { useEffect } from 'react';
import useDashboardStore from '../../stores/dashboardStore';
import Header from './Header';
import DashboardGrid from './DashboardGrid';

const Layout = ({ children }) => {
  const { theme } = useDashboardStore();
  
  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="p-6">
        <DashboardGrid />
        {children}
      </main>
    </div>
  );
};

export default Layout;

