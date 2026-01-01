import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { MasterAuthProvider } from './context/MasterAuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import ServerWelcome from './components/Servers/ServerWelcome';
import ServerManagement from './components/Servers/ServerManagement';
import { Dashboard } from './components/Layout/Dashboard';
import { DeviceList } from './components/Devices/DeviceList';
import { QueryInterface } from './components/Query/QueryInterface';
import { TokenManagement } from './components/Tokens/TokenManagement';
import { RetentionPolicies } from './components/Retention/RetentionPolicies';
import { Settings } from './components/Settings/Settings';
import { DeviceKPI } from './components/Analytics/DeviceKPI';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Home: React.FC = () => (
  <div>
    <div className="header">
      <h1>Dashboard</h1>
    </div>
    <div className="card">
      <div className="card-header">Welcome to LoRaDB UI</div>
      <p>Use the navigation menu to:</p>
      <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
        <li>View and manage devices</li>
        <li>Execute queries against LoRaDB</li>
        <li>Create and manage API tokens for long-lived access</li>
        <li>Configure data retention policies to automatically delete old data</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <MasterAuthProvider>
            <AuthProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/servers" element={<ServerWelcome />} />
                <Route path="/servers/manage" element={<ServerManagement />} />
                <Route path="/" element={<Dashboard />}>
                  <Route index element={<Home />} />
                  <Route path="devices" element={<DeviceList />} />
                  <Route path="query" element={<QueryInterface />} />
                  <Route path="tokens" element={<TokenManagement />} />
                  <Route path="retention" element={<RetentionPolicies />} />
                  <Route path="analytics" element={<DeviceKPI />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </BrowserRouter>
            </AuthProvider>
          </MasterAuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
