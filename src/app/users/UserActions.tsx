'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { createUser, updateUser, deleteUser } from '@/actions/users';

export default function UserActions({ mode, user, clients }: { mode: 'create' | 'edit' | 'delete', user?: any, clients?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (mode === 'create') {
      res = await createUser(formData);
    } else if (mode === 'edit') {
      res = await updateUser(user.id, formData);
    }

    if (res?.error) {
      alert(res.error);
    } else {
      setIsOpen(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete this user?`)) {
      setLoading(true);
      const res = await deleteUser(user.id);
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
          <Plus size={18} /> Add User
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
              <h2>{mode === 'create' ? 'Add User' : 'Edit User'}</h2>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="full_name" className="form-input" required defaultValue={user?.full_name} placeholder="e.g. Juan Pérez" />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" required defaultValue={user?.email} placeholder="admin@example.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Password {mode === 'edit' && '(Leave blank to keep unchanged)'}</label>
                <input type="password" name="password" className="form-input" required={mode === 'create'} placeholder="Min 8 characters" />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Client (Tenant)</label>
                  <select name="client_id" className="form-select" defaultValue={user?.client_id || ''}>
                    <option value="">None (Global Admin)</option>
                    {(clients || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Role</label>
                  <select name="role" className="form-select" defaultValue={user?.role || 'staff'}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              {mode === 'edit' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input type="checkbox" name="is_active" value="true" defaultChecked={user?.is_active} id="is_active_user" />
                  <label htmlFor="is_active_user" style={{ color: 'var(--text-primary)' }}>Active Account</label>
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
