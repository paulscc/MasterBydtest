'use client';

import { useState, useEffect } from 'react';
import { Database, Users, Shield, Server, AlertCircle, CheckCircle } from 'lucide-react';
import QuickBackendLogin from '@/components/QuickBackendLogin';
import { backendAuthService } from '@/lib/auth-backend';
import './Admin.css';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticated = backendAuthService.restoreSession();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      fetchSchemas();
    }
  }, []);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = backendAuthService.getAuthHeaders();
      const response = await fetch('https://d2o45auo4j2cpf.cloudfront.net/api/admin/create-schema', {
        method: 'GET',
        headers
      });

      const data = await response.json();

      if (data.success) {
        setSchemas(data.schemas || []);
      } else {
        setError(data.error || 'Error obteniendo esquemas');
      }
    } catch (error) {
      setError('Error de conexión con el backend externo');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (authenticated) {
      fetchSchemas();
    } else {
      setSchemas([]);
    }
  };

  const user = backendAuthService.getUser();
  const timeRemaining = backendAuthService.getTimeRemainingFormatted();

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Backend Administration</h1>
          <p>Manage external backend schemas and authentication</p>
        </div>
      </div>

      <QuickBackendLogin />

      {isAuthenticated && (
        <>
          <div className="auth-status-card">
            <div className="auth-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={24} style={{ color: '#22c55e' }} />
                <h2>Authenticated Session</h2>
              </div>
              <div className="auth-info">
                <div><strong>User:</strong> {user?.email}</div>
                <div><strong>Backend:</strong> https://d2o45auo4j2cpf.cloudfront.net</div>
                <div><strong>Time Remaining:</strong> {timeRemaining}</div>
              </div>
            </div>
          </div>

          <div className="schemas-section">
            <div className="section-header">
              <h2>Database Schemas</h2>
              <button className="btn btn-secondary" onClick={fetchSchemas} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {error && (
              <div className="error-card">
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                <div>
                  <h3>Error</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="schemas-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Database size={24} style={{ color: '#6366f1' }} />
                  </div>
                  <div className="stat-content">
                    <h3>{schemas.length}</h3>
                    <p>Total Schemas</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={24} style={{ color: '#10b981' }} />
                  </div>
                  <div className="stat-content">
                    <h3>{schemas.filter(s => s.startsWith('tenant_')).length}</h3>
                    <p>Tenant Schemas</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Server size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="stat-content">
                    <h3>External</h3>
                    <p>Backend</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && schemas.length > 0 && (
              <div className="schemas-list">
                <h3>Available Schemas</h3>
                <div className="schema-items">
                  {schemas.map((schema, index) => (
                    <div key={index} className="schema-item">
                      <div className="schema-icon">
                        <Database size={16} style={{ color: '#6366f1' }} />
                      </div>
                      <div className="schema-name">{schema}</div>
                      <div className="schema-type">
                        {schema.startsWith('tenant_') ? (
                          <span className="badge badge-success">Tenant</span>
                        ) : schema === 'public' ? (
                          <span className="badge badge-info">System</span>
                        ) : (
                          <span className="badge badge-secondary">Other</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && schemas.length === 0 && (
              <div className="empty-state">
                <Database size={48} style={{ color: '#9ca3af' }} />
                <h3>No Schemas Found</h3>
                <p>No schemas are available in the external backend.</p>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .admin-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .page-header p {
          color: var(--text-secondary);
          margin: 0.5rem 0 0 0;
        }

        .auth-status-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .auth-header h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .auth-info {
          display: flex;
          gap: 2rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .schemas-section {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .schemas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--card-bg);
        }

        .stat-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .stat-content p {
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
        }

        .error-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .error-card h3 {
          margin: 0 0 0.5rem 0;
          color: #991b1b;
        }

        .error-card p {
          margin: 0;
          color: #7f1d1d;
        }

        .schemas-list {
          margin-top: 2rem;
        }

        .schemas-list h3 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .schema-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .schema-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .schema-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--card-bg);
        }

        .schema-name {
          flex: 1;
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .badge-info {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .badge-secondary {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          color: var(--text-primary);
          margin: 1rem 0;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:hover {
          background: var(--bg-secondary);
          border-color: var(--primary);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }
      `}</style>
    </div>
  );
}
