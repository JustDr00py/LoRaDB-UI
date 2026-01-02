import React from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { WidgetInstance, MeasurementDefinition } from '../../types/widgets';
import { WidgetContainer } from './WidgetContainer';

interface DashboardGridProps {
  widgets: WidgetInstance[];
  layouts: { lg: Layout[] };
  timeRange: string;
  refreshInterval?: number;
  onLayoutChange: (layout: Layout[]) => void;
  onDeleteWidget: (id: string) => void;
  onEditWidget: (widget: WidgetInstance) => void;
  getMeasurement: (deviceType: string, measurementId: string) => MeasurementDefinition | undefined;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  layouts,
  timeRange,
  refreshInterval,
  onLayoutChange,
  onDeleteWidget,
  onEditWidget,
  getMeasurement,
}) => {
  return (
    <GridLayout
      className="dashboard-grid"
      layout={layouts.lg}
      cols={12}
      rowHeight={60}
      width={1200}
      onLayoutChange={onLayoutChange}
      draggableHandle=".widget-header"
      draggableCancel=".widget-actions"
      resizeHandles={['se']}
      compactType="vertical"
      preventCollision={false}
    >
      {widgets.map((widget) => {
        const measurement = widget.deviceType
          ? getMeasurement(widget.deviceType, widget.measurementId)
          : undefined;

        return (
          <div key={widget.id} className="grid-item">
            <WidgetContainer
              widget={widget}
              measurement={measurement}
              timeRange={timeRange}
              refreshInterval={refreshInterval}
              onDelete={() => onDeleteWidget(widget.id)}
              onEdit={() => onEditWidget(widget)}
            />
          </div>
        );
      })}
    </GridLayout>
  );
};
