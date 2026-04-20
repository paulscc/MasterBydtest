'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { createClient, updateClient, deleteClient } from '@/actions/clients';

export default function ClientActions({ mode, client }: { mode: 'create' | 'edit' | 'delete', client?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (mode === 'create') {
      res = await createClient(formData);
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
              <div className="form-group">
                <label className="form-label">DB Connection String</label>
                <input name="db_connection_url" className="form-input" defaultValue={client?.db_connection_url} placeholder="postgresql://..." />
              </div>
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
