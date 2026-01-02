import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import type { DeviceTypeDefinition, WidgetInstance, WidgetType } from '../../types/widgets';
import { getDevices } from '../../api/endpoints';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: WidgetInstance) => void;
  deviceTypes: DeviceTypeDefinition[];
  editWidget?: WidgetInstance;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deviceTypes,
  editWidget,
}) => {
  const [devEui, setDevEui] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [measurementId, setMeasurementId] = useState('');
  const [widgetType, setWidgetType] = useState<WidgetType>('time-series');
  const [title, setTitle] = useState('');
  const [conversionEnabled, setConversionEnabled] = useState(false);
  const [convertTo, setConvertTo] = useState<'fahrenheit' | 'kelvin'>('fahrenheit');
  const [customYAxisMin, setCustomYAxisMin] = useState<string>('');
  const [customYAxisMax, setCustomYAxisMax] = useState<string>('');
  const [advancedSettingsExpanded, setAdvancedSettingsExpanded] = useState(false);

  // Fetch devices for dropdown
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  // Reset or populate form based on mode
  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setDevEui('');
      setDeviceType('');
      setMeasurementId('');
      setWidgetType('time-series');
      setTitle('');
      setConversionEnabled(false);
      setConvertTo('fahrenheit');
      setCustomYAxisMin('');
      setCustomYAxisMax('');
    } else if (editWidget) {
      // Populate fields when editing
      setDevEui(editWidget.devEui);
      setDeviceType(editWidget.deviceType || '');
      setMeasurementId(editWidget.measurementId);
      setWidgetType(editWidget.widgetType);
      setTitle(editWidget.title || '');
      setConversionEnabled(editWidget.conversion?.enabled || false);
      setConvertTo(editWidget.conversion?.convertTo || 'fahrenheit');
      setCustomYAxisMin(editWidget.customYAxisMin !== undefined ? String(editWidget.customYAxisMin) : '');
      setCustomYAxisMax(editWidget.customYAxisMax !== undefined ? String(editWidget.customYAxisMax) : '');
    }
  }, [isOpen, editWidget]);

  // Auto-select first device type when available
  useEffect(() => {
    if (deviceTypes.length > 0 && !deviceType) {
      setDeviceType(deviceTypes[0].deviceType);
    }
  }, [deviceTypes, deviceType]);

  if (!isOpen) {
    return null;
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.deviceType === deviceType);
  const measurements = selectedDeviceType?.measurements || [];

  const selectedMeasurement = measurements.find((m) => m.id === measurementId);

  // Get available widget types for selected measurement
  const availableWidgetTypes: WidgetType[] = selectedMeasurement
    ? (Object.entries(selectedMeasurement.widgets)
        .filter(([_, config]) => config.enabled)
        .map(([type, _]) => type) as WidgetType[])
    : ['current-value', 'time-series', 'gauge', 'status'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!devEui || !deviceType || !measurementId || !widgetType) {
      alert('Please fill in all required fields');
      return;
    }

    const widget: WidgetInstance = {
      id: editWidget ? editWidget.id : uuidv4(), // Preserve ID when editing
      devEui,
      deviceType,
      measurementId,
      widgetType,
      title: title || undefined,
      conversion: conversionEnabled ? { enabled: true, convertTo } : undefined,
      customYAxisMin: customYAxisMin !== '' ? Number(customYAxisMin) : undefined,
      customYAxisMax: customYAxisMax !== '' ? Number(customYAxisMax) : undefined,
    };

    onSave(widget);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editWidget ? 'Edit Widget' : 'Add Widget'}</h2>
          <button onClick={onClose} className="modal-close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Device Selection */}
          <div className="form-group">
            <label htmlFor="device">
              Device <span className="required">*</span>
            </label>
            <select
              id="device"
              className="form-control"
              value={devEui}
              onChange={(e) => setDevEui(e.target.value)}
              required
            >
              <option value="">-- Select a device --</option>
              {devicesData?.devices.map((device) => (
                <option key={device.dev_eui} value={device.dev_eui}>
                  {device.device_name || device.dev_eui} ({device.dev_eui})
                </option>
              ))}
            </select>
          </div>

          {/* Device Type Selection */}
          <div className="form-group">
            <label htmlFor="device-type">
              Device Type <span className="required">*</span>
            </label>
            <select
              id="device-type"
              className="form-control"
              value={deviceType}
              onChange={(e) => {
                setDeviceType(e.target.value);
                setMeasurementId(''); // Reset measurement when device type changes
              }}
              required
            >
              <option value="">-- Select device type --</option>
              {deviceTypes.map((dt) => (
                <option key={dt.deviceType} value={dt.deviceType}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Measurement Selection */}
          {deviceType && (
            <div className="form-group">
              <label htmlFor="measurement">
                Measurement <span className="required">*</span>
              </label>
              <select
                id="measurement"
                className="form-control"
                value={measurementId}
                onChange={(e) => {
                  setMeasurementId(e.target.value);
                  // Auto-select default widget type for this measurement
                  const m = measurements.find((m) => m.id === e.target.value);
                  if (m) {
                    setWidgetType(m.defaultWidget);
                  }
                }}
                required
              >
                <option value="">-- Select measurement --</option>
                {measurements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Widget Type Selection */}
          {measurementId && (
            <div className="form-group">
              <label htmlFor="widget-type">
                Widget Type <span className="required">*</span>
              </label>
              <select
                id="widget-type"
                className="form-control"
                value={widgetType}
                onChange={(e) => setWidgetType(e.target.value as WidgetType)}
                required
              >
                {availableWidgetTypes.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Title */}
          <div className="form-group">
            <label htmlFor="title">Custom Title (optional)</label>
            <input
              type="text"
              id="title"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty to use measurement name"
            />
          </div>

          {/* Advanced Settings */}
          {selectedMeasurement && (selectedMeasurement.unit === '°C' || widgetType === 'time-series') && (
            <div className="advanced-settings">
              <div
                className="advanced-settings-header"
                onClick={() => setAdvancedSettingsExpanded(!advancedSettingsExpanded)}
              >
                <h3>Advanced Settings</h3>
                <span className="toggle-icon">{advancedSettingsExpanded ? '▼' : '▶'}</span>
              </div>

              {advancedSettingsExpanded && (
                <div className="advanced-settings-content">
                  {/* Temperature Conversion */}
                  {selectedMeasurement.unit === '°C' && (
                <>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={conversionEnabled}
                        onChange={(e) => setConversionEnabled(e.target.checked)}
                      />
                      <span>Enable Temperature Conversion</span>
                    </label>
                  </div>

                  {conversionEnabled && (
                    <div className="form-group">
                      <label htmlFor="convert-to">Convert To</label>
                      <select
                        id="convert-to"
                        className="form-control"
                        value={convertTo}
                        onChange={(e) => setConvertTo(e.target.value as 'fahrenheit' | 'kelvin')}
                      >
                        <option value="fahrenheit">Fahrenheit (°F)</option>
                        <option value="kelvin">Kelvin (K)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Chart Y-Axis Range */}
              {widgetType === 'time-series' && (
                <>
                  <div className="form-group">
                    <label htmlFor="custom-y-min">Custom Y-Axis Minimum (optional)</label>
                    <input
                      type="number"
                      id="custom-y-min"
                      className="form-control"
                      value={customYAxisMin}
                      onChange={(e) => setCustomYAxisMin(e.target.value)}
                      placeholder="Leave empty for auto"
                      step="any"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="custom-y-max">Custom Y-Axis Maximum (optional)</label>
                    <input
                      type="number"
                      id="custom-y-max"
                      className="form-control"
                      value={customYAxisMax}
                      onChange={(e) => setCustomYAxisMax(e.target.value)}
                      placeholder="Leave empty for auto"
                      step="any"
                    />
                  </div>
                </>
              )}
                </div>
              )}
            </div>
          )}

          {/* Measurement Info */}
          {selectedMeasurement && (
            <div className="measurement-info">
              <strong>Measurement Details:</strong>
              <div>Path: {selectedMeasurement.path}</div>
              <div>
                Unit: {selectedMeasurement.unit} | Decimals: {selectedMeasurement.decimals}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editWidget ? 'Update Widget' : 'Add Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
