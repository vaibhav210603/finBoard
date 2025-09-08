import { useState, useEffect } from 'react';
import { Plus, Moon, Sun, Download, Upload, Trash2, Settings } from 'lucide-react';
import useDashboardStore from '../../stores/dashboardStore';
import AddWidgetModal from '../modals/AddWidgetModal';

const Header = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { 
    theme, 
    toggleTheme, 
    widgets, 
    exportDashboard, 
    importDashboard, 
    clearDashboard 
  } = useDashboardStore();
  
  // Fix hydration mismatch by only showing widget count after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const handleExport = () => {
    const data = exportDashboard();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        importDashboard(data);
      } catch (error) {
        alert('Failed to import dashboard: Invalid file format');
      }
    };
    reader.readAsText(file);
  };
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire dashboard? This action cannot be undone.')) {
      clearDashboard();
    }
  };
  
  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FD</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Finance Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time financial data visualization
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Widget Count - Only show after hydration to prevent mismatch */}
            {isHydrated && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Widgets:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {widgets.length}
                </span>
              </div>
            )}
            
            {/* Dashboard Actions */}
            <div className="flex items-center gap-1">
              {/* Import */}
              <label className="btn-secondary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              
              {/* Export */}
              <button
                onClick={handleExport}
                className="btn-secondary"
                disabled={widgets.length === 0}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              {/* Clear */}
              <button
                onClick={handleClear}
                className="btn-danger"
                disabled={widgets.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            
            {/* Add Widget Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Widget</span>
            </button>
          </div>
        </div>
        
        {/* Quick Stats - Only show after hydration */}
        {isHydrated && widgets.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <span>•</span>
            <span>
              {widgets.filter(w => w.type === 'table').length} Tables
            </span>
            <span>•</span>
            <span>
              {widgets.filter(w => w.type === 'finance_card').length} Cards
            </span>
            <span>•</span>
            <span>
              {widgets.filter(w => w.type === 'chart').length} Charts
            </span>
          </div>
        )}
      </header>
      
      <AddWidgetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
};

export default Header;
