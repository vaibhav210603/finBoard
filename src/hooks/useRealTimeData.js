import { useEffect, useRef, useCallback } from 'react';
import useDashboardStore from '../stores/dashboardStore';

const useRealTimeData = (widgetId, fetchFunction, interval = 30000) => {
  const intervalRef = useRef(null);
  const { 
    getCachedData, 
    setCachedData, 
    setWidgetLoading, 
    isWidgetLoading,
    getWidget 
  } = useDashboardStore();
  
  const widget = getWidget(widgetId);
  const isActive = widget && !document.hidden;
  
  const fetchData = useCallback(async (force = false) => {
    if (!fetchFunction || isWidgetLoading(widgetId)) return null;
    
    const cacheKey = `widget_${widgetId}_data`;
    
    // Check cache first unless force refresh
    if (!force) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Widget cache hit for ${cacheKey}`);
        return cachedData;
      }
    }
    
    try {
      setWidgetLoading(widgetId, true);
      console.log(`Widget cache miss for ${cacheKey}, calling API...`);
      const data = await fetchFunction();
      
      if (data) {
        setCachedData(cacheKey, data, interval);
        console.log(`Widget data cached for ${cacheKey} with TTL ${interval}ms`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for widget ${widgetId}:`, error);
      throw error;
    } finally {
      setWidgetLoading(widgetId, false);
    }
  }, [widgetId, fetchFunction, interval, getCachedData, setCachedData, setWidgetLoading, isWidgetLoading]);
  
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (isActive) {
        // Don't force refresh - let the cache system decide
        fetchData(false);
      }
    }, interval);
  }, [fetchData, interval, isActive]);
  
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  const refreshData = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (isActive) {
        startPolling();
        // Check cache first, don't force refresh
        setTimeout(() => fetchData(false), 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling(); // Ensure cleanup
    };
  }, [isActive, startPolling, stopPolling, fetchData]);
  
  // Start/stop polling based on widget state
  useEffect(() => {
    if (isActive) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return stopPolling;
  }, [isActive, startPolling, stopPolling]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);
  
  return {
    fetchData,
    refreshData,
    isLoading: isWidgetLoading(widgetId),
  };
};

export default useRealTimeData;
