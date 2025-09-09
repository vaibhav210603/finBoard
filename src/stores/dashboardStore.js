import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Widget types
export const WIDGET_TYPES = {
  TABLE: 'table',
  FINANCE_CARD: 'finance_card',
  CHART: 'chart',
};

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  CANDLESTICK: 'candlestick',
  BAR: 'bar',
};

// Finance card types
export const FINANCE_CARD_TYPES = {
  WATCHLIST: 'watchlist',
  MARKET_GAINERS: 'market_gainers',
  PERFORMANCE: 'performance',
  FINANCIAL_DATA: 'financial_data',
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // Dashboard state
      widgets: [],
      selectedWidget: null,
      isDragging: false,
      theme: 'light',
      
      // Layout configuration
      layout: [],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
      
      // Data cache
      dataCache: {},
      cacheExpiry: {},
      
      // Initialize cache cleanup on startup
      initializeCache: () => {
        const { dataCache, cacheExpiry } = get();
        const now = Date.now();
        const newDataCache = { ...dataCache };
        const newCacheExpiry = { ...cacheExpiry };
        
        // Remove expired entries
        Object.keys(cacheExpiry).forEach(key => {
          if (cacheExpiry[key] && now > cacheExpiry[key]) {
            delete newDataCache[key];
            delete newCacheExpiry[key];
          }
        });
        
        set({
          dataCache: newDataCache,
          cacheExpiry: newCacheExpiry,
        });
      },
      
      // Loading states
      loadingWidgets: [],
      
      // Actions
      addWidget: (widgetConfig) => {
        const id = generateId();
        const widget = {
          id,
          ...widgetConfig,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const state = get();
        const widgetWidth = widgetConfig.defaultWidth || 400; // pixels
        const widgetHeight = widgetConfig.defaultHeight || 300; // pixels
        
        // Find the next available position using pixel-based collision detection
        const findNextPosition = (existingLayout) => {
          // Handle empty layout case
          if (existingLayout.length === 0) {
            return { x: 20, y: 20 };
          }
          
          const margin = 20; // Minimum margin between widgets
          const maxY = Math.max(0, ...existingLayout.map(item => item.y + item.h));
          
          // Try to find a position that doesn't overlap with existing widgets
          for (let y = margin; y <= maxY + margin; y += 10) {
            for (let x = margin; x <= 1200 - widgetWidth - margin; x += 10) {
              let canPlace = true;
              
              // Check collision with existing widgets
              for (const existing of existingLayout) {
                if (get().itemsOverlap(
                  { x, y, w: widgetWidth, h: widgetHeight },
                  { x: existing.x, y: existing.y, w: existing.w, h: existing.h }
                )) {
                  canPlace = false;
                  break;
                }
              }
              
              if (canPlace) {
                return { x, y };
              }
            }
          }
          
          // If no space found, place at the bottom with margin
          return { x: margin, y: maxY + margin };
        };
        
        const position = findNextPosition(state.layout);
        
        const newLayout = {
          i: id,
          x: position.x,
          y: position.y,
          w: widgetWidth,
          h: widgetHeight,
          minW: widgetConfig.minWidth || 2,
          minH: widgetConfig.minHeight || 2,
        };
        
        set((state) => ({
          widgets: [...state.widgets, widget],
          layout: [...state.layout, newLayout],
        }));
        
        return id;
      },
      
      removeWidget: (widgetId) => {
        set((state) => ({
          widgets: state.widgets.filter(w => w.id !== widgetId),
          layout: state.layout.filter(l => l.i !== widgetId),
          selectedWidget: state.selectedWidget === widgetId ? null : state.selectedWidget,
        }));
        
        // Clear cache for this widget
        set((state) => {
          const newDataCache = { ...state.dataCache };
          const newCacheExpiry = { ...state.cacheExpiry };
          delete newDataCache[widgetId];
          delete newCacheExpiry[widgetId];
          return {
            dataCache: newDataCache,
            cacheExpiry: newCacheExpiry,
          };
        });
      },
      
      updateWidget: (widgetId, updates) => {
        set((state) => ({
          widgets: state.widgets.map(widget =>
            widget.id === widgetId
              ? { ...widget, ...updates, updatedAt: new Date().toISOString() }
              : widget
          ),
        }));
      },
      
      selectWidget: (widgetId) => {
        set({ selectedWidget: widgetId });
      },
      
      clearSelection: () => {
        set({ selectedWidget: null });
      },
      
      updateLayout: (newLayout) => {
        // Clean up any overlapping widgets
        const cleanedLayout = get().removeOverlaps(newLayout);
        set({ layout: cleanedLayout });
      },
      
      updateWidgetPosition: (widgetId, x, y) => {
        set((state) => {
          const updatedLayout = state.layout.map(item => 
            item.i === widgetId 
              ? { ...item, x: Math.max(0, x), y: Math.max(0, y) }
              : item
          );
          
          // Check for collisions and adjust positions dynamically
          return { layout: get().resolveCollisions(updatedLayout, widgetId) };
        });
      },
      
      resolveCollisions: (layout, movingWidgetId) => {
        const movingWidget = layout.find(item => item.i === movingWidgetId);
        if (!movingWidget) return layout;
        
        const result = [...layout];
        const margin = 10; // Minimum separation between widgets
        
        // Check for collisions with other widgets
        for (let i = 0; i < result.length; i++) {
          const other = result[i];
          if (other.i === movingWidgetId) continue;
          
          if (get().itemsOverlap(movingWidget, other)) {
            // Calculate overlap and push the other widget
            const overlapX = Math.min(movingWidget.x + movingWidget.w, other.x + other.w) - 
                           Math.max(movingWidget.x, other.x);
            const overlapY = Math.min(movingWidget.y + movingWidget.h, other.y + other.h) - 
                           Math.max(movingWidget.y, other.y);
            
            if (overlapX > 0 && overlapY > 0) {
              // Determine push direction based on overlap
              if (overlapX < overlapY) {
                // Push horizontally
                if (movingWidget.x < other.x) {
                  other.x = movingWidget.x + movingWidget.w + margin;
                } else {
                  other.x = movingWidget.x - other.w - margin;
                }
              } else {
                // Push vertically
                if (movingWidget.y < other.y) {
                  other.y = movingWidget.y + movingWidget.h + margin;
                } else {
                  other.y = movingWidget.y - other.h - margin;
                }
              }
              
              // Ensure the pushed widget stays within bounds
              other.x = Math.max(0, other.x);
              other.y = Math.max(0, other.y);
            }
          }
        }
        
        return result;
      },
      
      updateWidgetSize: (widgetId, width, height) => {
        set((state) => ({
          layout: state.layout.map(item => 
            item.i === widgetId 
              ? { ...item, w: Math.max(2, width), h: Math.max(2, height) }
              : item
          )
        }));
      },
      
      removeOverlaps: (layout) => {
        if (layout.length <= 1) return layout;
        
        const sortedLayout = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
        const result = [];
        
        for (const item of sortedLayout) {
          let canPlace = true;
          let newY = item.y;
          
          // Check for overlaps with existing items
          for (const existing of result) {
            if (get().itemsOverlap(item, existing)) {
              canPlace = false;
              // Try to place below the overlapping item
              newY = Math.max(newY, existing.y + existing.h);
            }
          }
          
          if (!canPlace) {
            item.y = newY;
          }
          
          result.push(item);
        }
        
        return result;
      },
      
      itemsOverlap: (item1, item2) => {
        return !(
          item1.x >= item2.x + item2.w ||
          item2.x >= item1.x + item1.w ||
          item1.y >= item2.y + item2.h ||
          item2.y >= item1.y + item1.h
        );
      },
      
      setDragging: (isDragging) => {
        set({ isDragging });
      },
      
      // Theme management
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }));
      },
      
      setTheme: (theme) => {
        set({ theme });
      },
      
      // Data caching
      getCachedData: (key) => {
        const { dataCache, cacheExpiry } = get();
        const expiry = cacheExpiry[key];
         
        if (expiry && Date.now() > expiry) {
          set((state) => {
            const newDataCache = { ...state.dataCache };
            const newCacheExpiry = { ...state.cacheExpiry };
            delete newDataCache[key];
            delete newCacheExpiry[key];
            return {
              dataCache: newDataCache,
              cacheExpiry: newCacheExpiry,
            };
          });
          return null;
        }
        
        const cachedItem = dataCache[key];
        if (cachedItem && typeof cachedItem === 'object' && cachedItem.data) {
          return cachedItem.data;
        }
        
        return cachedItem || null;
      },
      
      // Get stale cached data (expired but still available)
      getStaleCachedData: (key) => {
        const { dataCache, cacheExpiry } = get();
        const expiry = cacheExpiry[key];
        const cachedItem = dataCache[key];
        
        // If data exists but is expired, return it as stale
        if (cachedItem && expiry && Date.now() > expiry) {
          if (typeof cachedItem === 'object' && cachedItem.data) {
            return cachedItem.data;
          }
          return cachedItem;
        }
        
        return null;
      },
      
      // Get cache metadata
      getCacheMetadata: (key) => {
        const { dataCache, cacheExpiry } = get();
        const cachedItem = dataCache[key];
        const expiry = cacheExpiry[key];
        
        if (!cachedItem) return null;
        
        return {
          timestamp: cachedItem.timestamp || null,
          provider: cachedItem.provider || null,
          endpoint: cachedItem.endpoint || null,
          args: cachedItem.args || null,
          ttl: cachedItem.ttl || null,
          expiresAt: expiry || null,
          isExpired: expiry ? Date.now() > expiry : false,
          age: cachedItem.timestamp ? Date.now() - cachedItem.timestamp : null
        };
      },
      
      setCachedData: (key, data, ttl = 300000) => { // 5 minutes default TTL
        const expiryTime = Date.now() + ttl;
        
        set((state) => {
          // Clean up expired entries before adding new data
          const now = Date.now();
          const newDataCache = { ...state.dataCache };
          const newCacheExpiry = { ...state.cacheExpiry };
          
          // Remove expired entries
          Object.keys(newCacheExpiry).forEach(cacheKey => {
            if (newCacheExpiry[cacheKey] && now > newCacheExpiry[cacheKey]) {
              delete newDataCache[cacheKey];
              delete newCacheExpiry[cacheKey];
            }
          });
          
          // Add new data
          newDataCache[key] = data;
          newCacheExpiry[key] = expiryTime;
          
          // Limit cache size to prevent localStorage from getting too large
          const maxCacheEntries = 50;
          const cacheKeys = Object.keys(newDataCache);
          if (cacheKeys.length > maxCacheEntries) {
            // Remove oldest entries (by expiry time)
            const sortedKeys = cacheKeys.sort((a, b) => 
              (newCacheExpiry[a] || 0) - (newCacheExpiry[b] || 0)
            );
            
            const keysToRemove = sortedKeys.slice(0, cacheKeys.length - maxCacheEntries);
            keysToRemove.forEach(keyToRemove => {
              delete newDataCache[keyToRemove];
              delete newCacheExpiry[keyToRemove];
            });
          }
          
          return {
            dataCache: newDataCache,
            cacheExpiry: newCacheExpiry,
          };
        });
      },
      
      clearCache: () => {
        set({
          dataCache: {},
          cacheExpiry: {},
        });
      },
      
      // Clear expired cache entries
      clearExpiredCache: () => {
        const { dataCache, cacheExpiry } = get();
        const now = Date.now();
        const newDataCache = { ...dataCache };
        const newCacheExpiry = { ...cacheExpiry };
        
        Object.keys(cacheExpiry).forEach(key => {
          if (cacheExpiry[key] && now > cacheExpiry[key]) {
            delete newDataCache[key];
            delete newCacheExpiry[key];
          }
        });
        
        set({
          dataCache: newDataCache,
          cacheExpiry: newCacheExpiry,
        });
      },
      
      // Get cache statistics
      getCacheStats: () => {
        const { dataCache, cacheExpiry } = get();
        const now = Date.now();
        let totalEntries = 0;
        let expiredEntries = 0;
        let totalSize = 0;
        const providerStats = {};
        
        Object.keys(dataCache).forEach(key => {
          totalEntries++;
          const item = dataCache[key];
          const expiry = cacheExpiry[key];
          
          if (expiry && now > expiry) {
            expiredEntries++;
          }
          
          // Estimate size (rough calculation)
          totalSize += JSON.stringify(item).length;
          
          // Count by provider
          if (item && typeof item === 'object' && item.provider) {
            providerStats[item.provider] = (providerStats[item.provider] || 0) + 1;
          }
        });
        
        return {
          totalEntries,
          expiredEntries,
          activeEntries: totalEntries - expiredEntries,
          totalSize,
          providerStats,
          hitRate: 0 // This would need to be tracked separately
        };
      },
      
      // Clear cache by provider
      clearCacheByProvider: (provider) => {
        const { dataCache, cacheExpiry } = get();
        const newDataCache = { ...dataCache };
        const newCacheExpiry = { ...cacheExpiry };
        
        Object.keys(dataCache).forEach(key => {
          const item = dataCache[key];
          if (item && typeof item === 'object' && item.provider === provider) {
            delete newDataCache[key];
            delete newCacheExpiry[key];
          }
        });
        
        set({
          dataCache: newDataCache,
          cacheExpiry: newCacheExpiry,
        });
      },
      
      // Loading states
      setWidgetLoading: (widgetId, isLoading) => {
        set((state) => {
          const currentLoading = [...state.loadingWidgets];
          if (isLoading) {
            if (!currentLoading.includes(widgetId)) {
              currentLoading.push(widgetId);
            }
          } else {
            const index = currentLoading.indexOf(widgetId);
            if (index > -1) {
              currentLoading.splice(index, 1);
            }
          }
          return { loadingWidgets: currentLoading };
        });
      },
      
      isWidgetLoading: (widgetId) => {
        return get().loadingWidgets.includes(widgetId);
      },
      
      // Dashboard management
      exportDashboard: () => {
        const { widgets, layout, theme } = get();
        return {
          widgets,
          layout,
          theme,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
      },
      
      importDashboard: (dashboardData) => {
        if (dashboardData.version === '1.0') {
          set({
            widgets: dashboardData.widgets || [],
            layout: dashboardData.layout || [],
            theme: dashboardData.theme || 'light',
          });
        }
      },
      
      clearDashboard: () => {
        set({
          widgets: [],
          layout: [],
          selectedWidget: null,
          dataCache: {},
          cacheExpiry: {},
          loadingWidgets: [],
        });
      },
      
      // Utility functions
      getWidget: (widgetId) => {
        return get().widgets.find(w => w.id === widgetId);
      },
      
      getWidgetsByType: (type) => {
        return get().widgets.filter(w => w.type === type);
      },
    }),

    {
      name: 'finance-dashboard-storage',
      partialize: (state) => ({
        widgets: state.widgets,
        layout: state.layout,
        theme: state.theme,
        dataCache: state.dataCache,
        cacheExpiry: state.cacheExpiry,
      }),
      // Use modern storage configuration with SSR safety
      storage: {
        getItem: (name) => {
          try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
              return null;
            }
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.warn('Failed to parse stored data:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
              return;
            }
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('Failed to store data:', error);
          }
        },
        removeItem: (name) => {
          // Check if we're in a browser environment
          if (typeof window === 'undefined') {
            return;
          }
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useDashboardStore;
