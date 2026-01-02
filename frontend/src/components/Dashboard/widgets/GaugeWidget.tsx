import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { WidgetData, GaugeWidgetConfig, MeasurementDefinition, WidgetInstance } from '../../../types/widgets';
import { getConvertedYAxisRange } from '../../../utils/widgetDataProcessor';

interface GaugeWidgetProps {
  data: WidgetData;
  measurement: MeasurementDefinition;
  config: GaugeWidgetConfig;
  widget: WidgetInstance;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({ data, measurement, config, widget }) => {
  if (data.error) {
    return <div className="widget-error">{data.error}</div>;
  }

  if (data.currentValue === undefined) {
    return <div className="widget-no-data">No data available</div>;
  }

  const displayUnit = data.unit || measurement.unit;

  // Convert min/max if temperature conversion is enabled
  const convertedRange = getConvertedYAxisRange(config.min, config.max, widget.conversion);
  const gaugeMin = convertedRange.min ?? config.min;
  const gaugeMax = convertedRange.max ?? config.max;

  // Build color zones for axisLine - convert zone boundaries if needed
  const colorZones = config.zones
    ? config.zones.map((zone) => {
        const convertedTo = widget.conversion?.enabled
          ? getConvertedYAxisRange(zone.to, zone.to, widget.conversion).min ?? zone.to
          : zone.to;
        return [convertedTo / gaugeMax, zone.color] as [number, string];
      })
    : [[1, '#10b981']];

  const option = {
    series: [
      {
        type: 'gauge',
        min: gaugeMin,
        max: gaugeMax,
        startAngle: 200,
        endAngle: -20,
        axisLine: {
          lineStyle: {
            width: 20,
            color: colorZones,
          },
        },
        pointer: {
          itemStyle: {
            color: 'auto',
          },
          length: '60%',
        },
        axisTick: {
          distance: -20,
          length: 5,
          lineStyle: {
            color: '#fff',
            width: 1,
          },
        },
        splitLine: {
          distance: -20,
          length: 15,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        axisLabel: {
          distance: -40,
          color: '#666',
          fontSize: 10,
          formatter: (value: number) => {
            return value.toFixed(0);
          },
        },
        detail: {
          valueAnimation: true,
          formatter: `{value} ${displayUnit}`,
          fontSize: 18,
          fontWeight: 'bold',
          offsetCenter: [0, '70%'],
        },
        data: [
          {
            value: data.currentValue,
          },
        ],
      },
    ],
  };

  return (
    <div className="gauge-widget">
      <ReactECharts option={option} style={{ height: '250px', width: '100%' }} />
    </div>
  );
};
