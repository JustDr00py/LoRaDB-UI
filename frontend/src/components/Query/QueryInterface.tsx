import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { executeQuery, getDevices } from '../../api/endpoints';
import { buildQuery, validateQueryConfig, exampleQueries } from '../../utils/queryBuilder';
import { formatDate } from '../../utils/dateFormatter';
import type { QueryConfig, FrameType, TimeRangeType } from '../../types/api';
import { useSearchParams } from 'react-router-dom';

export const QueryInterface: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDevEui = searchParams.get('devEui') || '';

  const [queryText, setQueryText] = useState('');
  const [useBuilder, setUseBuilder] = useState(true);
  const [config, setConfig] = useState<QueryConfig>({
    devEui: initialDevEui,
    frameType: 'all',
    timeRangeType: 'last',
    lastDuration: '1',
    lastUnit: 'h',
  });

  const { data: devicesData } = useQuery({ queryKey: ['devices'], queryFn: getDevices });

  const mutation = useMutation({
    mutationFn: executeQuery,
  });

  const handleExecute = () => {
    let query: string;

    if (useBuilder) {
      const error = validateQueryConfig(config);
      if (error) {
        alert(error);
        return;
      }
      query = buildQuery(config);
    } else {
      query = queryText.trim();
    }

    if (!query) {
      alert('Please enter a query');
      return;
    }

    mutation.mutate({ query });
  };

  const updateConfig = (updates: Partial<QueryConfig>) => {
    setConfig({ ...config, ...updates });
  };

  return (
    <div>
      <div className="header">
        <h1>Query</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setUseBuilder(!useBuilder)}>
            {useBuilder ? 'Switch to Editor' : 'Switch to Builder'}
          </button>
        </div>
      </div>

      {useBuilder ? (
        <div className="card">
          <div className="card-header">Query Builder</div>
          <div className="form-group">
            <label>Device EUI</label>
            <select className="form-control" value={config.devEui} onChange={(e) => updateConfig({ devEui: e.target.value })}>
              <option value="">Select device...</option>
              {devicesData?.devices.map((d) => (
                <option key={d.dev_eui} value={d.dev_eui}>
                  {d.dev_eui} {d.device_name ? `(${d.device_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Frame Type</label>
            <select className="form-control" value={config.frameType} onChange={(e) => updateConfig({ frameType: e.target.value as FrameType })}>
              <option value="all">All frames (*)</option>
              <option value="uplink">Uplink only</option>
              <option value="downlink">Downlink only</option>
              <option value="join">Join frames only</option>
              <option value="decoded_payload">Decoded payload only</option>
              <option value="custom">Custom fields...</option>
            </select>
          </div>

          {config.frameType === 'custom' && (
            <div className="form-group">
              <label>Custom Fields (comma-separated, supports nested fields with dot notation)</label>
              <input
                className="form-control"
                type="text"
                placeholder="e.g., f_port, f_cnt, decoded_payload.object.BatV, decoded_payload.object.TempC_SHT"
                value={config.customFields?.join(', ') || ''}
                onChange={(e) => updateConfig({ customFields: e.target.value.split(',').map(f => f.trim()).filter(f => f.length > 0) })}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Examples: decoded_payload.object.BatV, rx_info.rssi, dr.spreading_factor
              </small>
            </div>
          )}

          <div className="form-group">
            <label>Time Range</label>
            <select className="form-control" value={config.timeRangeType} onChange={(e) => updateConfig({ timeRangeType: e.target.value as TimeRangeType })}>
              <option value="none">No time filter</option>
              <option value="last">Last X time</option>
              <option value="since">Since date</option>
              <option value="between">Between dates</option>
            </select>
          </div>

          {config.timeRangeType === 'last' && (
            <div className="form-row">
              <div className="form-group">
                <label>Duration</label>
                <input className="form-control" type="number" value={config.lastDuration} onChange={(e) => updateConfig({ lastDuration: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select className="form-control" value={config.lastUnit} onChange={(e) => updateConfig({ lastUnit: e.target.value as any })}>
                  <option value="ms">Milliseconds</option>
                  <option value="s">Seconds</option>
                  <option value="m">Minutes</option>
                  <option value="h">Hours</option>
                  <option value="d">Days</option>
                  <option value="w">Weeks</option>
                </select>
              </div>
            </div>
          )}

          {config.timeRangeType === 'since' && (
            <div className="form-group">
              <label>Since Date (ISO 8601)</label>
              <input className="form-control" type="datetime-local" onChange={(e) => updateConfig({ sinceDate: new Date(e.target.value).toISOString() })} />
            </div>
          )}

          {config.timeRangeType === 'between' && (
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input className="form-control" type="datetime-local" onChange={(e) => updateConfig({ startDate: new Date(e.target.value).toISOString() })} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input className="form-control" type="datetime-local" onChange={(e) => updateConfig({ endDate: new Date(e.target.value).toISOString() })} />
              </div>
            </div>
          )}

          <div className="alert alert-info">
            Generated query: <code>{buildQuery(config)}</code>
          </div>

          <button className="btn btn-primary" onClick={handleExecute} disabled={mutation.isPending}>
            {mutation.isPending ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">Query Editor</div>
          <div className="form-group">
            <label>Query</label>
            <textarea className="form-control" value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="SELECT * FROM device '0123456789ABCDEF' WHERE LAST '1h'" />
          </div>
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Example Queries</summary>
            {exampleQueries.map((ex, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <strong>{ex.name}:</strong>
                <div className="json-display" style={{ marginTop: '5px' }}>
                  <code>{ex.query}</code>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setQueryText(ex.query)} style={{ marginTop: '5px' }}>Use this query</button>
              </div>
            ))}
          </details>
          <button className="btn btn-primary" onClick={handleExecute} disabled={mutation.isPending}>
            {mutation.isPending ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      )}

      {mutation.isError && (
        <div className="alert alert-error">
          Error: {(mutation.error as any)?.response?.data?.message || (mutation.error as Error).message}
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="card">
          <div className="card-header">Results</div>
          <div className="query-stats">
            <div className="stat-card">
              <div className="stat-label">Device EUI</div>
              <div className="stat-value">{mutation.data.dev_eui}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Frames</div>
              <div className="stat-value">{mutation.data.total_frames}</div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Received At</th>
                  <th>F Port</th>
                  <th>F Cnt</th>
                  <th>{config.frameType === 'decoded_payload' ? 'Decoded Payload' : 'Data'}</th>
                </tr>
              </thead>
              <tbody>
                {mutation.data.frames.map((frame, i) => {
                  // Extract actual frame data from nested structure (Uplink, Downlink, Join)
                  // Or use the frame directly if it's not nested
                  const frameData = frame.Uplink || frame.Downlink || frame.Join || frame;

                  return (
                    <tr key={i}>
                      <td>{formatDate(frameData?.received_at || frame?.received_at)}</td>
                      <td>{frameData?.f_port ?? frame?.f_port ?? '-'}</td>
                      <td>{frameData?.f_cnt ?? frame?.f_cnt ?? '-'}</td>
                      <td>
                        {config.frameType === 'decoded_payload' && frameData?.decoded_payload ? (
                          <details open>
                            <summary style={{ cursor: 'pointer' }}>View Decoded Payload</summary>
                            <pre className="json-display">{JSON.stringify(frameData.decoded_payload, null, 2)}</pre>
                          </details>
                        ) : (
                          <details>
                            <summary style={{ cursor: 'pointer' }}>View JSON</summary>
                            <pre className="json-display">{JSON.stringify(frame, null, 2)}</pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
