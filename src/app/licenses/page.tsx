import { supabaseAdmin } from '@/lib/supabase';
import LicenseActions from './LicenseActions';
import '../clients/Clients.css';

export default async function LicensesPage() {
  const [{ data: licenses, error: licensesError }, { data: clients, error: clientsError }] = await Promise.all([
    supabaseAdmin.from('licenses').select('client_id, id, api_key, status, modules, expires_at, created_at, clients!inner(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('clients').select('id, name').order('name', { ascending: true })
  ]);

  if (licensesError) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error loading licenses</div>;
  }

  return (
    <div className="clients-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Licenses</h1>
          <p>Manage API keys, module access, and expiration for tenants.</p>
        </div>
        <LicenseActions mode="create" clients={clients || []} />
      </header>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Modules</th>
              <th>Expires</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(licenses || []).map((license: any) => (
              <tr key={license.id}>
                <td style={{ fontWeight: 500 }}>{license.clients?.name || 'Unknown Client'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <code style={{ background: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {license.api_key.substring(0, 8)}...
                  </code>
                </td>
                <td>
                  <span className={`badge ${license.status === 'ACTIVE' ? 'badge-success' : license.status === 'EXPIRED' ? 'badge-danger' : 'badge-warning'}`}>
                    {license.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {JSON.stringify(license.modules)}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(license.expires_at).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <LicenseActions mode="edit" license={license} clients={clients || []} />
                  <LicenseActions mode="delete" license={license} />
                </td>
              </tr>
            ))}
            {(!licenses || licenses.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No licenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
