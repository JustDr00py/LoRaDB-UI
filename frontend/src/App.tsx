import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { Login } from './components/Auth/Login';
import { Dashboard } from './components/Layout/Dashboard';
import { DeviceList } from './components/Devices/DeviceList';
import { QueryInterface } from './components/Query/QueryInterface';
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
        <li>Check your token information</li>
      </ul>
    </div>
  </div>
);

const TokenInfo: React.FC = () => {
  const token = localStorage.getItem('jwt_token');
  const username = localStorage.getItem('jwt_username');
  const expiresAt = localStorage.getItem('jwt_expires_at');

  return (
    <div>
      <div className="header">
        <h1>Token Information</h1>
      </div>
      <div className="card">
        <div className="form-group">
          <label>Username</label>
          <input className="form-control" value={username || ''} readOnly />
        </div>
        <div className="form-group">
          <label>Expires At</label>
          <input className="form-control" value={expiresAt || ''} readOnly />
        </div>
        <div className="form-group">
          <label>JWT Token</label>
          <textarea className="form-control" value={token || ''} readOnly style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }} />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Dashboard />}>
                <Route index element={<Home />} />
                <Route path="devices" element={<DeviceList />} />
                <Route path="query" element={<QueryInterface />} />
                <Route path="tokens" element={<TokenInfo />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
