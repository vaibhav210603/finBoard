import { useMemo } from 'react';
import { WIDGET_TYPES } from '../../stores/dashboardStore';
import BaseWidget from './BaseWidget';
import TableWidget from './TableWidget';
import FinanceCardWidget from './FinanceCardWidget';
import ChartWidget from './ChartWidget';

const WidgetRenderer = ({ widget }) => {
  const WidgetComponent = useMemo(() => {
    switch (widget.type) {
      case WIDGET_TYPES.TABLE:
        return TableWidget;
      case WIDGET_TYPES.FINANCE_CARD:
        return FinanceCardWidget;
      case WIDGET_TYPES.CHART:
        return ChartWidget;
      default:
        return null;
    }
  }, [widget.type]);
  
  if (!WidgetComponent) {
    return (
      <BaseWidget widget={widget} error={{ message: `Unknown widget type: ${widget.type}` }}>
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Widget type "{widget.type}" is not supported
          </p>
        </div>
      </BaseWidget>
    );
  }
  
  return <WidgetComponent widget={widget} />;
};

export default WidgetRenderer;

