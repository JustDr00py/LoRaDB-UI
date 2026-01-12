import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { WidgetData, TimeSeriesWidgetConfig, MeasurementDefinition, WidgetInstance } from '../../../types/widgets';
import { formatDate } from '../../../utils/dateFormatter';
import { getConvertedYAxisRange } from '../../../utils/widgetDataProcessor';

interface TimeSeriesWidgetProps {
  data: WidgetData;
  measurement: MeasurementDefinition;
  config: TimeSeriesWidgetConfig;
  widget: WidgetInstance;
  yAxisOverride?: {
    customYAxisMin?: number;
    customYAxisMax?: number;
  };
}

export const TimeSeriesWidget: React.FC<TimeSeriesWidgetProps> = ({
  data,
  measurement,
  config,
  widget,
  yAxisOverride,
}) => {
  if (data.error) {
    return <div className="widget-error">{data.error}</div>;
  }

  if (!data.timeSeries || data.timeSeries.length === 0) {
    return <div className="widget-no-data">No time series data available</div>;
  }

  // Time series only works with numeric data
  if (typeof data.currentValue !== 'number') {
    return <div className="widget-error">Time series widget requires numeric data</div>;
  }

  const displayUnit = 'unit' in data ? data.unit : measurement.unit;
  const displayDecimals = 'decimals' in data && data.decimals !== undefined ? data.decimals : measurement.decimals;

  // Y-AXIS CONFIGURATION WITH PRIORITY:
  // 1. Per-measurement override (highest priority)
  // 2. Global widget customYAxisMin/Max (for backward compatibility)
  // 3. Temperature conversion
  // 4. Measurement definition config (lowest priority)

  let yAxisMin = config.yAxisMin;
  let yAxisMax = config.yAxisMax;

  // PRIORITY 1: Per-measurement override (NEW)
  if (yAxisOverride?.customYAxisMin !== undefined) {
    yAxisMin = yAxisOverride.customYAxisMin;
  }
  // PRIORITY 2: Global widget custom value (backward compatibility)
  else if (widget.customYAxisMin !== undefined) {
    yAxisMin = widget.customYAxisMin;
  }
  // PRIORITY 3: Temperature conversion
  else if (widget.conversion?.enabled && measurement.unit === '°C') {
    const converted = getConvertedYAxisRange(config.yAxisMin, config.yAxisMax, widget.conversion);
    yAxisMin = converted.min;
    yAxisMax = converted.max;
  }

  // Same logic for max
  if (yAxisOverride?.customYAxisMax !== undefined) {
    yAxisMax = yAxisOverride.customYAxisMax;
  } else if (widget.customYAxisMax !== undefined) {
    yAxisMax = widget.customYAxisMax;
  }

  // Format data for Recharts
  const chartData = data.timeSeries.map((point) => ({
    timestamp: new Date(point.timestamp).getTime(),
    value: point.value,
  }));

  const lineColor = config.color || '#2563eb';

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTooltip = (value: number) => {
    if (typeof value === 'number') {
      return `${value.toFixed(displayDecimals)} ${displayUnit}`;
    }
    return value;
  };

  const formatTooltipLabel = (timestamp: number) => {
    return formatDate(new Date(timestamp).toISOString());
  };

  const ChartComponent = config.showArea ? AreaChart : LineChart;

  return (
    <div className="time-series-widget">
      <div className="widget-title">{measurement.name}</div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
              stroke="#666"
              style={{ fontSize: '10px' }}
            />
            <YAxis
              domain={[yAxisMin ?? 'auto', yAxisMax ?? 'auto']}
              label={{ value: displayUnit, angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
              tickFormatter={(value) => value.toFixed(displayDecimals)}
              stroke="#666"
              style={{ fontSize: '10px' }}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            {config.showArea ? (
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                fill={lineColor}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
