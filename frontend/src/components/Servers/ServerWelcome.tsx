import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listServers } from '../../api/endpoints';
import { Server } from '../../types/api';
import AddServerModal from './AddServerModal';
import ServerPasswordModal from './ServerPasswordModal';

const ServerWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await listServers();
      setServers(response.servers);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerAdded = () => {
    setShowAddModal(false);
    loadServers();
  };

  const handleSelectServer = (server: Server) => {
    setSelectedServer(server);
    setShowPasswordModal(true);
  };

  const handleAuthSuccess = () => {
    // AuthContext will handle navigation after successful auth
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '10px' }}>Welcome to LoRaDB UI</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Select a server to connect or add a new one
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading servers...</p>
          </div>
        ) : servers.length === 0 ? (
          <div>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              No servers configured. Add your first server to get started.
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Add New Server
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Available Servers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => handleSelectServer(server)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '15px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {server.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      {server.host}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Add New Server
            </button>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                onClick={() => navigate('/servers/manage')}
                className="btn btn-sm"
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)' }}
              >
                Manage Servers
              </button>
            </div>
          </div>
        )}

        {showAddModal && (
          <AddServerModal
            onClose={() => setShowAddModal(false)}
            onServerAdded={handleServerAdded}
          />
        )}

        {showPasswordModal && selectedServer && (
          <ServerPasswordModal
            server={selectedServer}
            onClose={() => {
              setShowPasswordModal(false);
              setSelectedServer(null);
            }}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ServerWelcome;
