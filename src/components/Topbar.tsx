import { Bell, UserCircle } from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        {/* Minimal Search Placeholder Placeholder */}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <UserCircle size={28} />
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}
