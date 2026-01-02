import React from 'react';
import type { WidgetInstance, MeasurementDefinition } from '../../types/widgets';
import { useWidgetData } from '../../hooks/useWidgetData';
import { CurrentValueWidget } from './widgets/CurrentValueWidget';
import { TimeSeriesWidget } from './widgets/TimeSeriesWidget';
import { GaugeWidget } from './widgets/GaugeWidget';
import { StatusWidget } from './widgets/StatusWidget';

interface WidgetContainerProps {
  widget: WidgetInstance;
  measurement: MeasurementDefinition | undefined;
  timeRange: string;
  refreshInterval?: number;
  onDelete: () => void;
  onEdit: () => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  measurement,
  timeRange,
  refreshInterval,
  onDelete,
  onEdit,
}) => {
  const { data, isLoading, error } = useWidgetData(widget, measurement, timeRange, refreshInterval);

  const title = widget.title || measurement?.name || 'Widget';

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3>{title}</h3>
        <div className="widget-actions">
          <button onClick={onEdit} className="widget-edit-btn" title="Edit widget">
            ✎
          </button>
          <button onClick={onDelete} className="widget-delete-btn" title="Delete widget">
            ×
          </button>
        </div>
      </div>

      <div className="widget-body">
        {isLoading && (
          <div className="widget-loading">
            <div className="spinner"></div>
            <div>Loading...</div>
          </div>
        )}

        {error && !isLoading && (
          <div className="widget-error">
            Failed to load data: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && data && measurement && (
          <WidgetRenderer widget={widget} data={data} measurement={measurement} />
        )}

        {!isLoading && !error && !data && (
          <div className="widget-no-data">No data available</div>
        )}
      </div>
    </div>
  );
};

interface WidgetRendererProps {
  widget: WidgetInstance;
  data: any;
  measurement: MeasurementDefinition;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, data, measurement }) => {
  const widgetType = widget.widgetType;

  switch (widgetType) {
    case 'current-value':
      return (
        <CurrentValueWidget
          data={data}
          measurement={measurement}
          config={measurement.widgets['current-value']}
        />
      );

    case 'time-series':
      return (
        <TimeSeriesWidget
          data={data}
          measurement={measurement}
          config={measurement.widgets['time-series']}
          widget={widget}
        />
      );

    case 'gauge':
      return (
        <GaugeWidget
          data={data}
          measurement={measurement}
          config={measurement.widgets.gauge}
          widget={widget}
        />
      );

    case 'status':
      return (
        <StatusWidget
          data={data}
          measurement={measurement}
        />
      );

    default:
      return <div className="widget-error">Unknown widget type: {widgetType}</div>;
  }
};
