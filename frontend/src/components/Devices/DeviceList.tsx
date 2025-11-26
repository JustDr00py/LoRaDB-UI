import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '../../api/endpoints';
import { Loading } from '../Common/Loading';
import { formatRelativeTime } from '../../utils/dateFormatter';
import { useNavigate } from 'react-router-dom';

export const DeviceList: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load devices: {(error as Error).message}
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Devices</h1>
        <div>Total: {data?.total_devices || 0}</div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Device EUI</th>
                <th>Name</th>
                <th>Application ID</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.devices.map((device) => (
                <tr key={device.dev_eui} className="clickable">
                  <td><code>{device.dev_eui}</code></td>
                  <td>{device.device_name || '-'}</td>
                  <td>{device.application_id}</td>
                  <td>{formatRelativeTime(device.last_seen)}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/query?devEui=${device.dev_eui}`)}
                    >
                      Query
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.devices.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    No devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
