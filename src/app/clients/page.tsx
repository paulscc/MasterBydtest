import { supabaseAdmin } from '@/lib/supabase';
import ClientActions from './ClientActions';
import './Clients.css';

export default async function ClientsPage() {
  const { data: clients, error } = await supabaseAdmin.from('master_clients').select('*').order('created_at', { ascending: false });

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error loading clients: {error.message}</div>;
  }

  return (
    <div className="clients-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Clients</h1>
          <p>Manage tenant companies with automatic schema creation (Hybrid Backend System).</p>
        </div>
        <ClientActions mode="create" />
      </header>

      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0ea5e9', fontSize: '1rem' }}>
          Sistema Híbrido de Creación de Esquemas
        </h4>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Cada cliente creado genera automáticamente un esquema aislado con todas las tablas necesarias.
        </p>
        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '2rem' }}>
          <div>Backend primario: <strong>https://d2o45auo4j2cpf.cloudfront.net</strong></div>
          <div>Backend fallback: <strong>Local (localhost:3001)</strong></div>
          <div>Estado: <strong style={{ color: '#22c55e' }}>Activo</strong></div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Subdomain</th>
              <th>Schema</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((client: any) => {
              const schemaName = `tenant_${client.subdomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
              return (
                <tr key={client.id}>
                  <td style={{ fontWeight: 500 }}>{client.business_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{client.subdomain}</td>
                  <td>
                    <code style={{ 
                      backgroundColor: '#f3f4f6', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.875rem',
                      color: '#1f2937'
                    }}>
                      {schemaName}
                    </code>
                  </td>
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
              );
            })}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
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
