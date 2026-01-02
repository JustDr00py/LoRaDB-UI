import React from 'react';
import type { WidgetData, CurrentValueWidgetConfig, MeasurementDefinition } from '../../../types/widgets';
import { formatRelativeTime } from '../../../utils/dateFormatter';

interface CurrentValueWidgetProps {
  data: WidgetData;
  measurement: MeasurementDefinition;
  config: CurrentValueWidgetConfig;
}

export const CurrentValueWidget: React.FC<CurrentValueWidgetProps> = ({
  data,
  measurement,
  config,
}) => {
  if (data.error) {
    return <div className="widget-error">{data.error}</div>;
  }

  if (data.currentValue === undefined) {
    return <div className="widget-no-data">No data available</div>;
  }

  // Find matching threshold
  const threshold = config.thresholds?.find(
    (t) => data.currentValue! >= t.min && data.currentValue! < t.max
  );

  const color = threshold?.color || '#6b7280';
  const label = threshold?.label;

  const displayUnit = data.unit || measurement.unit;
  const displayDecimals = data.decimals !== undefined ? data.decimals : measurement.decimals;

  return (
    <div className="current-value-widget" style={{ borderLeftColor: color }}>
      <div className="value" style={{ color }}>
        {data.currentValue.toFixed(displayDecimals)}
      </div>
      <div className="unit">{displayUnit}</div>
      {label && <div className="threshold-label">{label}</div>}
      {data.timestamp && (
        <div className="timestamp">{formatRelativeTime(data.timestamp)}</div>
      )}
    </div>
  );
};
