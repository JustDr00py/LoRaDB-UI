import React from 'react';
import type {
  WidgetInstance,
  DeviceTypeDefinition,
  WidgetTemplate,
  TemplateSection,
  WidgetData,
  WidgetType,
} from '../../../types/widgets';
import { CurrentValueWidget } from './CurrentValueWidget';
import { TimeSeriesWidget } from './TimeSeriesWidget';
import { GaugeWidget } from './GaugeWidget';
import { StatusWidget } from './StatusWidget';

interface CompositeDeviceWidgetProps {
  widget: WidgetInstance;
  deviceType: DeviceTypeDefinition;
  template: WidgetTemplate;
  measurementData: Array<{ measurementId: string; data: WidgetData }>;
}

export const CompositeDeviceWidget: React.FC<CompositeDeviceWidgetProps> = ({
  widget,
  deviceType,
  template,
  measurementData,
}) => {
  // Render a single widget type for a measurement
  const renderWidget = (
    type: WidgetType,
    measurementId: string,
    data: WidgetData,
    size?: 'small' | 'medium' | 'large'
  ) => {
    const measurement = deviceType.measurements.find((m) => m.id === measurementId);
    if (!measurement) {
      return <div className="widget-error">Measurement not found: {measurementId}</div>;
    }

    const sizeClass = size ? `widget-${size}` : 'widget-medium';

    switch (type) {
      case 'current-value':
        return (
          <div key={`${measurementId}-${type}`} className={`composite-widget-item ${sizeClass}`}>
            <CurrentValueWidget
              data={data}
              measurement={measurement}
              config={measurement.widgets['current-value']}
            />
          </div>
        );

      case 'time-series':
        return (
          <div key={`${measurementId}-${type}`} className={`composite-widget-item ${sizeClass}`}>
            <TimeSeriesWidget
              data={data}
              measurement={measurement}
              config={measurement.widgets['time-series']}
              widget={widget}
            />
          </div>
        );

      case 'gauge':
        return (
          <div key={`${measurementId}-${type}`} className={`composite-widget-item ${sizeClass}`}>
            <GaugeWidget
              data={data}
              measurement={measurement}
              config={measurement.widgets.gauge}
              widget={widget}
            />
          </div>
        );

      case 'status':
        return (
          <div key={`${measurementId}-${type}`} className={`composite-widget-item ${sizeClass}`}>
            <StatusWidget data={data} measurement={measurement} />
          </div>
        );

      default:
        return (
          <div key={`${measurementId}-${type}`} className="widget-error">
            Unknown widget type: {type}
          </div>
        );
    }
  };

  // Render a template section (one or more measurements)
  const renderSection = (section: TemplateSection) => {
    // Check if this section is hidden via overrides
    if (Array.isArray(section.measurementId)) {
      // Combined chart section - handle multiple measurements
      const sectionMeasurementId = section.measurementId[0]; // Use first measurement for override lookup
      if (widget.sectionOverrides?.[sectionMeasurementId]?.hidden) {
        return null;
      }

      // For combined charts, we'll need special handling in the future
      // For now, render each measurement separately
      return section.measurementId.map((mId) => {
        const data = measurementData.find((md) => md.measurementId === mId);
        if (!data) return null;

        const displayTypes =
          widget.sectionOverrides?.[mId]?.displayTypes || section.displayTypes;

        return (
          <div key={mId} className="composite-section">
            <div className="composite-section-label">
              {deviceType.measurements.find((m) => m.id === mId)?.name}
            </div>
            {displayTypes.map((type) =>
              renderWidget(type, mId, data.data, section.layout?.[type]?.size)
            )}
          </div>
        );
      });
    } else {
      // Single measurement section
      const measurementId = section.measurementId;

      // Check if hidden via overrides
      if (widget.sectionOverrides?.[measurementId]?.hidden) {
        return null;
      }

      const data = measurementData.find((md) => md.measurementId === measurementId);
      if (!data) {
        return (
          <div key={measurementId} className="composite-section">
            <div className="widget-no-data">No data for {measurementId}</div>
          </div>
        );
      }

      // Get display types (from override or template)
      const displayTypes =
        widget.sectionOverrides?.[measurementId]?.displayTypes || section.displayTypes;

      return (
        <div key={measurementId} className="composite-section">
          <div className="composite-section-label">
            {deviceType.measurements.find((m) => m.id === measurementId)?.name}
          </div>
          <div className="composite-section-widgets">
            {displayTypes.map((type) =>
              renderWidget(type, measurementId, data.data, section.layout?.[type]?.size)
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`composite-widget composite-layout-${template.layout}`}>
      <div className="composite-body">
        {template.sections.map((section, idx) => (
          <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
        ))}
      </div>
    </div>
  );
};
