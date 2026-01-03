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

// Widget Template Section - defines how a measurement is displayed in a composite widget
export interface TemplateSection {
  measurementId: string | string[];  // Single ID or array for combined charts
  displayTypes: WidgetType[];        // Which visualizations to show (can be multiple!)
  combinedChart?: boolean;           // If true, combine multiple measurements in one chart
  chartConfig?: {
    title?: string;
    measurementIds?: string[];       // For combined charts
  };
  layout?: {
    [key in WidgetType]?: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom';
      size?: 'small' | 'medium' | 'large';
    };
  };
  hidden?: boolean;
}

// Widget Template - defines how to display multiple measurements for a device type
export interface WidgetTemplate {
  id: string;
  name: string;
  description?: string;
  layout: 'grid' | 'vertical' | 'horizontal';
  defaultSize: { w: number; h: number };
  sections: TemplateSection[];
}

// Device type definition (loaded from JSON files)
export interface DeviceTypeDefinition {
  deviceType: string;
  name: string;
  manufacturer: string;
  description: string;
  version: string;
  measurements: MeasurementDefinition[];
  widgetTemplates?: WidgetTemplate[];  // NEW: Templates for composite widgets
}

// Conversion settings for measurements
export interface ConversionSettings {
  enabled: boolean;
  convertTo?: 'fahrenheit' | 'kelvin'; // Temperature conversions
}

// Widget instance - what gets saved in dashboard layout
// Supports both legacy (single measurement) and composite (template-based) widgets
export interface WidgetInstance {
  id: string;                     // Unique widget ID (UUID)
  devEui: string;                 // Device to query
  deviceType?: string;            // Optional device type for auto-config

  // Legacy single-measurement widget fields
  measurementId?: string;         // Which measurement to display (legacy)
  widgetType?: WidgetType;        // Widget visualization type (legacy)

  // New composite widget fields
  templateId?: string;            // Which template to use (new)
  sectionOverrides?: {            // Customize template per instance (new)
    [measurementId: string]: {
      hidden?: boolean;           // Hide this measurement
      displayTypes?: WidgetType[]; // Override which visualizations to show
    };
  };
  sectionOrder?: string[];        // Custom order of measurement IDs (optional)

  // Shared fields
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
