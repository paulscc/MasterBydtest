import { supabaseAdmin } from '@/lib/supabase';
import ClientActions from './ClientActions';
import './Clients.css';

export default async function ClientsPage() {
  const { data: clients, error } = await supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error loading clients: {error.message}</div>;
  }

  return (
    <div className="clients-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Clients</h1>
          <p>Manage tenant companies and their database connections.</p>
        </div>
        <ClientActions mode="create" />
      </header>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((client: any) => (
              <tr key={client.id}>
                <td style={{ fontWeight: 500 }}>{client.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{client.slug}</td>
                <td>
                  <span className={`badge ${client.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {client.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <ClientActions mode="edit" client={client} />
                  <ClientActions mode="delete" client={client} />
                </td>
              </tr>
            ))}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
