import { supabaseAdmin } from '@/lib/supabase';
import { Users, Key, AlertTriangle, CheckCircle, Database, Server, Shield } from 'lucide-react';
import './Dashboard.css';

export default async function DashboardPage() {
  const [
    { count: totalClients },
    { count: activeLicenses },
    { count: expiredLicenses },
    { count: totalUsers },
    schemasData
  ] = await Promise.all([
    supabaseAdmin.from('master_clients').select('*', { head: true, count: 'exact' }),
    supabaseAdmin.from('licenses').select('*', { head: true, count: 'exact' }).eq('status', 'ACTIVE'),
    supabaseAdmin.from('licenses').select('*', { head: true, count: 'exact' }).eq('status', 'EXPIRED'),
    supabaseAdmin.from('master_users').select('*', { head: true, count: 'exact' }),
    fetch('http://localhost:3001/api/admin/create-schema').then(res => res.json()).catch(() => ({ schemas: [] }))
  ]);

  const totalSchemas = schemasData.schemas?.length || 0;
  const tenantSchemas = schemasData.schemas?.filter((s: string) => s.startsWith('tenant_')).length || 0;

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Multi-Tenant System with Hybrid Backend Architecture</p>
        </div>
      </header>
      
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Clients</h3>
            <p className="stat-value">{totalClients || 0}</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Licenses</h3>
            <p className="stat-value">{activeLicenses || 0}</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <Database size={24} />
          </div>
          <div className="stat-content">
            <h3>Database Schemas</h3>
            <p className="stat-value">{totalSchemas}</p>
            <small style={{ color: 'var(--text-secondary)' }}>{tenantSchemas} tenants</small>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Key size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{totalUsers || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Hybrid Backend System Status</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={20} style={{ color: '#0ea5e9' }} />
                <h4 style={{ margin: 0, color: '#0ea5e9', fontSize: '1rem' }}>
                  Sistema Híbrido Activo
                </h4>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Sistema de alta disponibilidad con fallback automático
              </p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>Backend primario: <strong>https://d2o45auo4j2cpf.cloudfront.net</strong></div>
                <div>Backend fallback: <strong>Local (localhost:3001)</strong></div>
                <div>Estado: <strong style={{ color: '#22c55e' }}>Operativo</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Server size={20} style={{ color: '#6366f1' }} />
              <h3>Architecture</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li>Multi-tenant PostgreSQL schemas</li>
              <li>Hybrid backend with fallback</li>
              <li>Automatic schema creation</li>
              <li>High availability system</li>
            </ul>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Database size={20} style={{ color: '#06b6d4' }} />
              <h3>Database Status</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li>Total schemas: {totalSchemas}</li>
              <li>Tenant schemas: {tenantSchemas}</li>
              <li>AWS RDS PostgreSQL</li>
              <li>SSL connections enabled</li>
            </ul>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users size={20} style={{ color: '#10b981' }} />
              <h3>User Management</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li>Total users: {totalUsers || 0}</li>
              <li>Master user database</li>
              <li>Tenant isolation</li>
              <li>Role-based permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
