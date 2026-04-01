import { supabaseAdmin } from '@/lib/supabase';
import UserActions from './UserActions';
import '../clients/Clients.css';

export default async function UsersPage() {
  const [{ data: users, error: usersError }, { data: clients, error: clientsError }] = await Promise.all([
    supabaseAdmin.from('users').select('*, clients(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('clients').select('id, name').order('name', { ascending: true })
  ]);

  if (usersError) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error loading users</div>;
  }

  return (
    <div className="clients-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Users</h1>
          <p>Manage access for client employees and administrators.</p>
        </div>
        <UserActions mode="create" clients={clients || []} />
      </header>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Client</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map((user: any) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.full_name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                <td>{user.clients?.name || 'Unassigned (Global)'}</td>
                <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                <td>
                  <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <UserActions mode="edit" user={user} clients={clients || []} />
                  <UserActions mode="delete" user={user} />
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
