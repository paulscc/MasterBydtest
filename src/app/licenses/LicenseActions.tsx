'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { createLicense, updateLicense, deleteLicense } from '@/actions/licenses';

export default function LicenseActions({ mode, license, clients }: { mode: 'create' | 'edit' | 'delete', license?: any, clients?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (mode === 'create') {
      res = await createLicense(formData);
    } else if (mode === 'edit') {
      res = await updateLicense(license.id, formData);
    }

    if (res?.error) {
      alert(res.error);
    } else {
      setIsOpen(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete this license?`)) {
      setLoading(true);
      const res = await deleteLicense(license.id);
      if (res?.error) alert(res.error);
      setLoading(false);
    }
  }

  function generateKey() {
    const key = 'sk_live_' + crypto.randomUUID().replace(/-/g, '');
    (document.getElementById('api_key') as HTMLInputElement).value = key;
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
          <Plus size={18} /> Issue License
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
              <h2>{mode === 'create' ? 'Issue License' : 'Edit License'}</h2>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              
              {mode === 'create' && (
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select name="client_id" className="form-select" required>
                    <option value="">Select a client...</option>
                    {(clients || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'create' && (
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input name="api_key" id="api_key" className="form-input" required placeholder="sk_live_..." />
                    <button type="button" onClick={generateKey} className="btn">Generate</button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" defaultValue={license?.status || 'ACTIVE'}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Modules (JSON Array or Comma Separated)</label>
                <input name="modules" className="form-input" defaultValue={license ? JSON.stringify(license.modules) : '["inventory", "slabs"]'} />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Max Users</label>
                  <input type="number" name="max_users" className="form-input" defaultValue={license?.max_users || 5} min="1" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Expires At</label>
                  <input type="date" name="expires_at" className="form-input" required 
                    defaultValue={license?.expires_at ? new Date(license.expires_at).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]} 
                  />
                </div>
              </div>

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
