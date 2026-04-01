import { supabaseAdmin } from '@/lib/supabase';
import { Users, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import './Dashboard.css';

export default async function DashboardPage() {
  const [
    { count: totalClients },
    { count: activeLicenses },
    { count: expiredLicenses },
    { count: totalUsers }
  ] = await Promise.all([
    supabaseAdmin.from('clients').select('*', { head: true, count: 'exact' }),
    supabaseAdmin.from('licenses').select('*', { head: true, count: 'exact' }).eq('status', 'ACTIVE'),
    supabaseAdmin.from('licenses').select('*', { head: true, count: 'exact' }).eq('status', 'EXPIRED'),
    supabaseAdmin.from('users').select('*', { head: true, count: 'exact' })
  ]);

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back, here's what's happening today.</p>
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
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Expired Licenses</h3>
            <p className="stat-value">{expiredLicenses || 0}</p>
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
        <div className="card">
          <h2>Recent Activity</h2>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Activity logging will appear here in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
