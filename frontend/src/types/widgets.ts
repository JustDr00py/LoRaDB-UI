// Widget Types and Interfaces for Dashboard Widget System

import type { Layout } from 'react-grid-layout';

// Widget Types
export type WidgetType = 'current-value' | 'time-series' | 'gauge' | 'status';

// Status levels
export type StatusLevel = 'success' | 'warning' | 'error' | 'info';

// Condition operators
export type ConditionOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'between';

// Threshold definition for current value widgets
export interface Threshold {
  min: number;
  max: number;
  color: string;
  label: string;
}

// Status condition for status widgets
export interface StatusCondition {
  operator: ConditionOperator;
  value?: number;
  min?: number;
  max?: number;
  status: StatusLevel;
  label: string;
}

// Gauge zone for gauge widgets
export interface GaugeZone {
  from: number;
  to: number;
  color: string;
}

// Widget-specific configurations

export interface CurrentValueWidgetConfig {
  enabled: boolean;
  thresholds?: Threshold[];
}

export interface TimeSeriesWidgetConfig {
  enabled: boolean;
  yAxisMin?: number;
  yAxisMax?: number;
  showArea?: boolean;
  color?: string;
}

export interface GaugeWidgetConfig {
  enabled: boolean;
  min: number;
  max: number;
  zones?: GaugeZone[];
}

export interface StatusWidgetConfig {
  enabled: boolean;
  conditions?: StatusCondition[];
}

// Measurement definition from device type JSON
export interface MeasurementDefinition {
  id: string;
  path: string;
  name: string;
  unit: string;
  decimals: number;
  defaultWidget: WidgetType;
  widgets: {
    'current-value': CurrentValueWidgetConfig;
    'time-series': TimeSeriesWidgetConfig;
    'gauge': GaugeWidgetConfig;
    'status': StatusWidgetConfig;
  };
}

// Device type definition (loaded from JSON files)
export interface DeviceTypeDefinition {
  deviceType: string;
  name: string;
  manufacturer: string;
  description: string;
  version: string;
  measurements: MeasurementDefinition[];
}

// Conversion settings for measurements
export interface ConversionSettings {
  enabled: boolean;
  convertTo?: 'fahrenheit' | 'kelvin'; // Temperature conversions
}

// Widget instance - what gets saved in dashboard layout
export interface WidgetInstance {
  id: string;                     // Unique widget ID (UUID)
  devEui: string;                 // Device to query
  deviceType?: string;            // Optional device type for auto-config
  measurementId: string;          // Which measurement to display
  widgetType: WidgetType;         // Widget visualization type
  title?: string;                 // Optional custom title
  config?: Partial<MeasurementDefinition>; // Override measurement config
  conversion?: ConversionSettings; // Unit conversion settings
  customYAxisMin?: number;        // Custom Y-axis minimum for charts
  customYAxisMax?: number;        // Custom Y-axis maximum for charts
}

// Dashboard layout (persisted to localStorage)
export interface DashboardLayout {
  version: string;
  timeRange: string;              // Global time range (e.g., "24h")
  autoRefresh: boolean;
  refreshInterval: number;        // Seconds
  widgets: WidgetInstance[];
  layouts: {
    lg: Layout[];
    md?: Layout[];
    sm?: Layout[];
  };
}

// Widget data - processed for rendering
export interface WidgetData {
  widgetId: string;
  currentValue?: number;
  timestamp?: string;
  timeSeries?: Array<{ timestamp: string; value: number }>;
  status?: {
    level: StatusLevel;
    label: string;
  };
  unit?: string; // Converted unit (e.g., °F instead of °C)
  decimals?: number; // Decimal places for display
  error?: string;
}

// Time series data point
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

// Status evaluation result
export interface StatusEvaluation {
  level: StatusLevel;
  label: string;
  color: string;
}
