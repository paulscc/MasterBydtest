'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { createClient, updateClient, deleteClient } from '@/actions/clients';
import BackendLogin from '@/components/BackendLogin';

export default function ClientActions({ mode, client }: { mode: 'create' | 'edit' | 'delete', client?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (mode === 'create') {
      // Crear cliente con esquema automáticamente (sistema híbrido)
      res = await createClient(formData);
      if (res?.success) {
        const backend = res.data.message.includes('fallback') ? 'local (fallback)' : 'externo';
        alert(`Cliente "${res.data.businessName}" creado exitosamente!\n\n` +
              `Esquema: ${res.data.schemaName}\n` +
              `Tablas: ${res.data.tablesCreated}\n` +
              `Backend: ${backend}\n` +
              `Estado: Activo`);
      }
    } else if (mode === 'edit') {
      res = await updateClient(client.id, formData);
    }

    if (res?.error) {
      alert(res.error);
    } else {
      setIsOpen(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete ${client.business_name}?`)) {
      setLoading(true);
      const res = await deleteClient(client.id);
      if (res?.error) alert(res.error);
      setLoading(false);
    }
  }

  if (mode === 'delete') {
    return (
      <button onClick={handleDelete} disabled={loading} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
        <Trash2 size={18} />
      </button>
    );
  }

  return (
    <>
      {mode === 'create' ? (
        <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
          <Plus size={18} /> Add Client
        </button>
      ) : (
        <button onClick={() => setIsOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <Edit2 size={18} />
        </button>
      )}

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2>{mode === 'create' ? 'Create Client' : 'Edit Client'}</h2>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            {mode === 'create' && <BackendLogin />}
            
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input name="business_name" className="form-input" required defaultValue={client?.business_name} placeholder="e.g. Mármoles del Norte" />
              </div>
              <div className="form-group">
                <label className="form-label">Subdomain</label>
                <input name="subdomain" className="form-input" required defaultValue={client?.subdomain} placeholder="e.g. marmoles-norte" />
              </div>
              {mode === 'create' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Admin Email</label>
                    <input name="admin_email" type="email" className="form-input" required placeholder="admin@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Password</label>
                    <input name="admin_password" type="password" className="form-input" required placeholder="Create admin password" />
                  </div>
                </>
              )}
              {mode === 'create' && (
                <div className="form-group">
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0ea5e9', fontSize: '0.875rem' }}>
                      Sistema Híbrido de Creación
                    </h4>
                    <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      El sistema intentará crear el esquema en el backend externo primero. 
                      Si no está disponible, usará automáticamente el backend local como fallback.
                    </p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <div>Backend primario: https://d2o45auo4j2cpf.cloudfront.net</div>
                      <div>Backend fallback: Local (localhost:3001)</div>
                    </div>
                  </div>
                </div>
              )}
              {mode === 'edit' && (
                <div className="form-group">
                  <label className="form-label">DB Connection String</label>
                  <input 
                    name="db_connection_url" 
                    className="form-input" 
                    defaultValue={client?.db_connection_url} 
                    placeholder="postgresql://..." 
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Solo para referencia. La conexión se gestiona automáticamente.
                  </small>
                </div>
              )}
              {mode === 'edit' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" name="is_active" value="true" defaultChecked={client?.is_active} id="is_active" />
                  <label htmlFor="is_active" style={{ color: 'var(--text-primary)' }}>Active</label>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
