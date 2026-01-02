import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { WidgetData, TimeSeriesWidgetConfig, MeasurementDefinition, WidgetInstance } from '../../../types/widgets';
import { formatDate } from '../../../utils/dateFormatter';
import { getConvertedYAxisRange } from '../../../utils/widgetDataProcessor';

interface TimeSeriesWidgetProps {
  data: WidgetData;
  measurement: MeasurementDefinition;
  config: TimeSeriesWidgetConfig;
  widget: WidgetInstance;
}

export const TimeSeriesWidget: React.FC<TimeSeriesWidgetProps> = ({
  data,
  measurement,
  config,
  widget,
}) => {
  if (data.error) {
    return <div className="widget-error">{data.error}</div>;
  }

  if (!data.timeSeries || data.timeSeries.length === 0) {
    return <div className="widget-no-data">No time series data available</div>;
  }

  const displayUnit = data.unit || measurement.unit;
  const displayDecimals = data.decimals !== undefined ? data.decimals : measurement.decimals;

  // Get Y-axis range: prioritize custom values, then convert default values if conversion is enabled
  let yAxisMin = config.yAxisMin;
  let yAxisMax = config.yAxisMax;

  if (widget.customYAxisMin !== undefined) {
    yAxisMin = widget.customYAxisMin;
  } else if (widget.conversion?.enabled) {
    const converted = getConvertedYAxisRange(config.yAxisMin, config.yAxisMax, widget.conversion);
    yAxisMin = converted.min;
    yAxisMax = converted.max;
  }

  if (widget.customYAxisMax !== undefined) {
    yAxisMax = widget.customYAxisMax;
  }

  const option = {
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: (value: number) => {
          const date = new Date(value);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        },
      },
    },
    yAxis: {
      type: 'value',
      name: displayUnit,
      min: yAxisMin,
      max: yAxisMax,
      axisLabel: {
        formatter: (value: number) => value.toFixed(displayDecimals),
      },
    },
    series: [
      {
        type: 'line',
        data: data.timeSeries.map((d) => [new Date(d.timestamp).getTime(), d.value]),
        smooth: true,
        areaStyle: config.showArea ? { opacity: 0.3 } : undefined,
        itemStyle: {
          color: config.color || '#2563eb',
        },
        lineStyle: {
          width: 2,
        },
        showSymbol: false,
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0];
        const value = point.value[1].toFixed(displayDecimals);
        const time = formatDate(new Date(point.value[0]).toISOString());
        return `<strong>${value} ${displayUnit}</strong><br/>${time}`;
      },
    },
  };

  return (
    <div className="time-series-widget">
      <ReactECharts option={option} style={{ height: '250px', width: '100%' }} />
    </div>
  );
};
