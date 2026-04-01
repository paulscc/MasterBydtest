import Link from 'next/link';
import { LayoutDashboard, Users, Key, Settings } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Key className="logo-icon" />
          <span>LicenseMaster</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link href="/" className="nav-item">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/clients" className="nav-item">
          <Users size={20} />
          <span>Clients</span>
        </Link>
        <Link href="/licenses" className="nav-item">
          <Key size={20} />
          <span>Licenses</span>
        </Link>
        <Link href="/users" className="nav-item">
          <Users size={20} />
          <span>Users</span>
        </Link>
      </nav>
      <div className="sidebar-footer">
        <Link href="/settings" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
