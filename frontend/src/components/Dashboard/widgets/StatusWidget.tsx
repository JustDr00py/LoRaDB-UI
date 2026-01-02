import React from 'react';
import type { WidgetData, MeasurementDefinition } from '../../../types/widgets';
import { getStatusColor, getStatusIcon } from '../../../utils/widgetDataProcessor';

interface StatusWidgetProps {
  data: WidgetData;
  measurement: MeasurementDefinition;
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({ data, measurement }) => {
  if (data.error) {
    return <div className="widget-error">{data.error}</div>;
  }

  if (!data.status || data.currentValue === undefined) {
    return <div className="widget-no-data">No data available</div>;
  }

  const backgroundColor = getStatusColor(data.status.level);
  const icon = getStatusIcon(data.status.level);

  const displayUnit = data.unit || measurement.unit;
  const displayDecimals = data.decimals !== undefined ? data.decimals : measurement.decimals;

  return (
    <div className="status-widget">
      <div className="status-badge" style={{ backgroundColor }}>
        <span className="status-icon">{icon}</span>
        <span className="status-label">{data.status.label}</span>
      </div>
      <div className="status-value">
        {data.currentValue.toFixed(displayDecimals)} {displayUnit}
      </div>
    </div>
  );
};
