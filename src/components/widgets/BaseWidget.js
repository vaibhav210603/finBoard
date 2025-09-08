import { useState, useEffect } from 'react';
import { X, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import useDashboardStore from '../../stores/dashboardStore';

const BaseWidget = ({ 
  widget, 
  children, 
  onRefresh, 
  isLoading = false, 
  error = null,
  showSettings = true,
  className = ''
}) => {
  const { removeWidget, selectWidget, selectedWidget, updateWidget } = useDashboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(widget.title || '');
  
  const isSelected = selectedWidget === widget.id;
  
  useEffect(() => {
    setTitle(widget.title || '');
  }, [widget.title]);
  
  const handleRemove = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this widget?')) {
      removeWidget(widget.id);
    }
  };
  
  const handleSettings = (e) => {
    e.stopPropagation();
    selectWidget(widget.id);
  };
  
  const handleRefresh = (e) => {
    e.stopPropagation();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  const handleTitleEdit = () => {
    setIsEditing(true);
  };
  
  const handleTitleSave = () => {
    updateWidget(widget.id, { title });
    setIsEditing(false);
  };
  
  const handleTitleCancel = () => {
    setTitle(widget.title || '');
    setIsEditing(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };
  
  return (
    <div 
      className={`widget-container ${isSelected ? 'ring-2 ring-primary-500' : ''} ${className}`}
      onClick={() => selectWidget(widget.id)}
    >
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyPress={handleKeyPress}
              className="input-field text-sm font-medium bg-transparent border-none p-0 focus:ring-0"
              autoFocus
            />
          ) : (
            <h3 
              className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
              onClick={handleTitleEdit}
              title={widget.title}
            >
              {widget.title || 'Untitled Widget'}
            </h3>
          )}
          
          {widget.subtitle && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              {widget.subtitle}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Loading indicator */}
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />
          )}
          
          {/* Error indicator */}
          {error && (
            <AlertCircle className="w-4 h-4 text-danger-500" title={error.message || 'Error occurred'} />
          )}
          
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              title="Refresh data"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {/* Settings button */}
          {showSettings && (
            <button
              onClick={handleSettings}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              title="Widget settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          {/* Remove button */}
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-danger-500 rounded transition-colors"
            title="Remove widget"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="widget-content">
        {error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-danger-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {error.message || 'Failed to load data'}
            </p>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className="btn-primary text-xs"
                disabled={isLoading}
              >
                Try Again
              </button>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-6 h-6 text-primary-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
      
      {/* Widget Footer */}
      {widget.lastUpdated && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(widget.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default BaseWidget;

