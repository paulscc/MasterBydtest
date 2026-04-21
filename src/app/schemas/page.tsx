'use client';

import { useState, useEffect } from 'react';
import { Database, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import './Schemas.css';

interface Schema {
  schema_name: string;
  table_count?: number;
  user_count?: number;
  created_at?: string;
}

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchemas();
  }, []);

  async function fetchSchemas() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/create-schema');
      const data = await response.json();

      if (data.success) {
        // Enriquecer datos de esquemas con información adicional
        const enrichedSchemas = await Promise.all(
          data.schemas.map(async (schemaName: string) => {
            if (schemaName === 'public') {
              return {
                schema_name: schemaName,
                table_count: 0,
                user_count: 0,
                created_at: 'System'
              };
            }

            // Para esquemas de tenant, obtener información adicional
            if (schemaName.startsWith('tenant_')) {
              try {
                const detailsResponse = await fetch(`/api/admin/schema-details/${schemaName}`);
                const details = await detailsResponse.json();
                
                return {
                  schema_name: schemaName,
                  table_count: details.table_count || 0,
                  user_count: details.user_count || 0,
                  created_at: details.created_at || 'Unknown'
                };
              } catch (error) {
                return {
                  schema_name: schemaName,
                  table_count: 0,
                  user_count: 0,
                  created_at: 'Unknown'
                };
              }
            }

            return {
              schema_name: schemaName,
              table_count: 0,
              user_count: 0,
              created_at: 'Unknown'
            };
          })
        );

        setSchemas(enrichedSchemas);
      } else {
        setError(data.error || 'Error loading schemas');
      }
    } catch (error) {
      setError('Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  }

  function getSchemaIcon(schemaName: string) {
    if (schemaName === 'public') {
      return <Database size={20} style={{ color: '#6366f1' }} />;
    }
    return <Users size={20} style={{ color: '#10b981' }} />;
  }

  function getSchemaType(schemaName: string) {
    if (schemaName === 'public') return 'System';
    if (schemaName.startsWith('tenant_')) return 'Tenant';
    return 'Other';
  }

  function getStatusBadge(schemaName: string) {
    if (schemaName === 'public') {
      return <span className="badge badge-info">System</span>;
    }
    return <span className="badge badge-success">Active</span>;
  }

  if (loading) {
    return (
      <div className="schemas-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading schemas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schemas-page">
        <div className="error-container">
          <AlertCircle size={48} style={{ color: '#ef4444' }} />
          <h2>Error Loading Schemas</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchSchemas}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schemas-page">
      <header className="page-header">
        <div>
          <h1>Database Schemas</h1>
          <p>Manage and monitor all database schemas in the system.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSchemas}>
          <Clock size={18} /> Refresh
        </button>
      </header>

      <div className="stats-grid">
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
            <h3>{schemas.filter(s => s.schema_name.startsWith('tenant_')).length}</h3>
            <p>Tenant Schemas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} style={{ color: '#22c55e' }} />
          </div>
          <div className="stat-content">
            <h3>{schemas.filter(s => s.schema_name !== 'public').reduce((acc, s) => acc + (s.table_count || 0), 0)}</h3>
            <p>Total Tables</p>
          </div>
        </div>
      </div>

      <div className="schemas-container">
        <div className="section-header">
          <h2>All Schemas</h2>
          <div className="filter-buttons">
            <button className="btn btn-sm btn-primary">All</button>
            <button className="btn btn-sm btn-secondary">Tenants</button>
            <button className="btn btn-sm btn-secondary">System</button>
          </div>
        </div>

        <div className="schemas-grid">
          {schemas.map((schema) => (
            <div key={schema.schema_name} className="schema-card">
              <div className="schema-header">
                <div className="schema-icon">
                  {getSchemaIcon(schema.schema_name)}
                </div>
                <div className="schema-info">
                  <h3>{schema.schema_name}</h3>
                  <p>{getSchemaType(schema.schema_name)} Schema</p>
                </div>
                <div className="schema-status">
                  {getStatusBadge(schema.schema_name)}
                </div>
              </div>

              <div className="schema-stats">
                <div className="stat-item">
                  <span className="stat-label">Tables</span>
                  <span className="stat-value">{schema.table_count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Users</span>
                  <span className="stat-value">{schema.user_count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Created</span>
                  <span className="stat-value">{schema.created_at}</span>
                </div>
              </div>

              <div className="schema-actions">
                <button className="btn btn-sm btn-secondary">View Details</button>
                {schema.schema_name.startsWith('tenant_') && (
                  <>
                    <button className="btn btn-sm btn-secondary">Manage</button>
                    <button className="btn btn-sm btn-danger">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {schemas.length === 0 && (
          <div className="empty-state">
            <Database size={48} style={{ color: '#9ca3af' }} />
            <h3>No Schemas Found</h3>
            <p>Start by creating a new client to automatically generate a schema.</p>
            <a href="/clients" className="btn btn-primary">
              Create First Client
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
