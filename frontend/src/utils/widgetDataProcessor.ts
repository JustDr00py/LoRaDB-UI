import type { Frame, FrameData } from '../types/api';
import type {
  WidgetData,
  WidgetInstance,
  MeasurementDefinition,
  StatusCondition,
  StatusLevel,
  TimeSeriesDataPoint,
  ConversionSettings,
} from '../types/widgets';
import { getNestedValue } from './queryParser';

/**
 * Process frames to extract widget data
 */
export function processWidgetData(
  frames: Frame[],
  widget: WidgetInstance,
  measurement: MeasurementDefinition
): WidgetData | null {
  if (!frames || frames.length === 0) {
    return null;
  }

  // Extract uplink frames - handle both nested (f.Uplink) and direct (f) structures
  // When query is "SELECT uplink", frames may be returned directly without nesting
  const uplinkFrames = frames
    .map((f) => f.Uplink || (f.dev_eui ? (f as unknown as FrameData) : undefined))
    .filter((f): f is FrameData => f !== undefined);

  if (uplinkFrames.length === 0) {
    return {
      widgetId: widget.id,
      error: 'No uplink frames found',
    };
  }

  // Extract measurement values from each frame
  const timeSeries: TimeSeriesDataPoint[] = [];

  for (const frame of uplinkFrames) {
    const value = extractMeasurementValue(frame, measurement.path);

    if (value !== null && frame.received_at) {
      // Apply conversion if enabled
      const convertedValue = convertTemperature(value, widget.conversion);

      timeSeries.push({
        timestamp: frame.received_at,
        value: convertedValue,
      });
    }
  }

  if (timeSeries.length === 0) {
    return {
      widgetId: widget.id,
      error: `No data found at path: ${measurement.path}`,
    };
  }

  // Sort by timestamp (oldest first)
  timeSeries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Get latest value
  const latest = timeSeries[timeSeries.length - 1];

  // Evaluate status (use original thresholds for now - TODO: convert thresholds)
  const status = evaluateStatus(latest.value, measurement.widgets.status.conditions);

  // Get converted unit
  const displayUnit = getConvertedUnit(measurement.unit, widget.conversion);

  return {
    widgetId: widget.id,
    currentValue: latest.value,
    timestamp: latest.timestamp,
    timeSeries,
    status,
    unit: displayUnit,
    decimals: measurement.decimals,
  };
}

/**
 * Extract a measurement value from a frame using dot notation path
 */
export function extractMeasurementValue(frame: FrameData, path: string): number | null {
  const value = getNestedValue(frame, path);

  if (value === null || value === undefined) {
    return null;
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return null;
  }

  return numValue;
}

/**
 * Evaluate status based on conditions
 */
export function evaluateStatus(
  value: number,
  conditions?: StatusCondition[]
): { level: StatusLevel; label: string } {
  if (!conditions || conditions.length === 0) {
    return { level: 'info', label: 'Unknown' };
  }

  for (const condition of conditions) {
    if (checkCondition(value, condition)) {
      return {
        level: condition.status,
        label: condition.label,
      };
    }
  }

  // No matching condition
  return { level: 'info', label: 'Unknown' };
}

/**
 * Check if a value matches a condition
 */
function checkCondition(value: number, condition: StatusCondition): boolean {
  switch (condition.operator) {
    case 'lt':
      return condition.value !== undefined && value < condition.value;
    case 'lte':
      return condition.value !== undefined && value <= condition.value;
    case 'gt':
      return condition.value !== undefined && value > condition.value;
    case 'gte':
      return condition.value !== undefined && value >= condition.value;
    case 'eq':
      return condition.value !== undefined && value === condition.value;
    case 'between':
      return (
        condition.min !== undefined &&
        condition.max !== undefined &&
        value >= condition.min &&
        value <= condition.max
      );
    default:
      return false;
  }
}

/**
 * Format value with unit
 */
export function formatValueWithUnit(
  value: number | undefined,
  unit: string,
  decimals: number
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Convert temperature value based on conversion settings
 */
export function convertTemperature(
  value: number,
  conversion?: ConversionSettings
): number {
  if (!conversion || !conversion.enabled || !conversion.convertTo) {
    return value;
  }

  switch (conversion.convertTo) {
    case 'fahrenheit':
      return (value * 9) / 5 + 32;
    case 'kelvin':
      return value + 273.15;
    default:
      return value;
  }
}

/**
 * Get converted unit based on conversion settings
 */
export function getConvertedUnit(
  originalUnit: string,
  conversion?: ConversionSettings
): string {
  if (!conversion || !conversion.enabled || !conversion.convertTo) {
    return originalUnit;
  }

  if (originalUnit === '°C') {
    switch (conversion.convertTo) {
      case 'fahrenheit':
        return '°F';
      case 'kelvin':
        return 'K';
      default:
        return originalUnit;
    }
  }

  return originalUnit;
}

/**
 * Get converted Y-axis range based on conversion settings
 */
export function getConvertedYAxisRange(
  originalMin: number | undefined,
  originalMax: number | undefined,
  conversion?: ConversionSettings
): { min: number | undefined; max: number | undefined } {
  if (!conversion || !conversion.enabled || !conversion.convertTo) {
    return { min: originalMin, max: originalMax };
  }

  return {
    min: originalMin !== undefined ? convertTemperature(originalMin, conversion) : undefined,
    max: originalMax !== undefined ? convertTemperature(originalMax, conversion) : undefined,
  };
}

/**
 * Get status color
 */
export function getStatusColor(level: StatusLevel): string {
  const colors: Record<StatusLevel, string> = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  };

  return colors[level] || colors.info;
}

/**
 * Get status icon
 */
export function getStatusIcon(level: StatusLevel): string {
  const icons: Record<StatusLevel, string> = {
    success: '✓',
    warning: '⚠',
    error: '✗',
    info: 'ℹ',
  };

  return icons[level] || icons.info;
}
