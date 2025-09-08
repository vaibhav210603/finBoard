import { useState, useCallback, useRef, useEffect } from 'react';
import useDashboardStore from '../../stores/dashboardStore';
import WidgetRenderer from '../widgets/WidgetRenderer';

const DashboardGrid = () => {
  const { 
    widgets, 
    layout, 
    updateLayout, 
    setDragging,
    updateWidgetPosition,
    updateWidgetSize
  } = useDashboardStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  const handleMouseDown = useCallback((e, widgetId) => {
    // Check if the click is on the widget header but NOT on interactive elements
    if (e.target.closest('.widget-header') && 
        !e.target.closest('button') && 
        !e.target.closest('input') &&
        !e.target.closest('h3')) {
      e.preventDefault();
      setIsDragging(true);
      setDragging(true);
      setDraggedWidget(widgetId);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [setDragging]);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggedWidget || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Update widget position
    updateWidgetPosition(draggedWidget, newX, newY);
  }, [isDragging, draggedWidget, dragOffset, updateWidgetPosition]);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragging(false);
      setDraggedWidget(null);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, setDragging]);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No widgets added yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Start building your dashboard by adding some widgets
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Click the "Add Widget" button to get started
        </p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`dashboard-grid relative min-h-screen ${isDragging ? 'dragging' : ''}`}
      style={{ padding: '16px' }}
    >
      {widgets.map((widget) => {
        const widgetLayout = layout.find(l => l.i === widget.id);
        if (!widgetLayout) return null;
        
        return (
          <div
            key={widget.id}
            className={`widget-container-absolute ${isDragging && draggedWidget === widget.id ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: `${widgetLayout.x}px`,
              top: `${widgetLayout.y}px`,
              width: `${widgetLayout.w}px`,
              height: `${widgetLayout.h}px`,
              zIndex: isDragging && draggedWidget === widget.id ? 1000 : 1,
              transform: isDragging && draggedWidget === widget.id ? 'rotate(2deg)' : 'none',
              boxShadow: isDragging && draggedWidget === widget.id ? '0 10px 25px rgba(0, 0, 0, 0.2)' : 'none',
              transition: isDragging && draggedWidget === widget.id ? 'none' : 'all 200ms ease',
            }}
            onMouseDown={(e) => handleMouseDown(e, widget.id)}
          >
            <WidgetRenderer widget={widget} />
          </div>
        );
      })}
      
      <style jsx global>{`
        .widget-container-absolute {
          box-sizing: border-box;
          user-select: none;
        }
        
        .widget-container-absolute.dragging {
          cursor: grabbing !important;
        }
        
        .widget-container-absolute .widget-header {
          cursor: grab;
        }
        
        .widget-container-absolute .widget-header:hover {
          background: rgb(0 0 0 / 0.02);
        }
        
        .dark .widget-container-absolute .widget-header:hover {
          background: rgb(255 255 255 / 0.02);
        }
        
        .widget-container-absolute.dragging .widget-header {
          cursor: grabbing;
        }
        
        .dashboard-grid.dragging {
          cursor: grabbing;
        }
        
        .dashboard-grid.dragging * {
          pointer-events: none;
        }
        
        .dashboard-grid.dragging .widget-container-absolute.dragging {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

export default DashboardGrid;

