import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const INBOX_ROLES = ['customer_service', 'sales', 'staff', 'senior_staff', 'supervisor', 'senior_management', 'ceo', 'admin'];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showInbox = INBOX_ROLES.includes(user?.role?.code);
  const isAdmin = user?.role?.code === 'admin';
  const canProvision = ['admin', 'senior_management', 'ceo'].includes(user?.role?.code);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">MSS-CRM</div>
        <nav>
          {isAdmin && <NavLink to="/admin">Admin Console</NavLink>}
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/leads">Leads</NavLink>
          {showInbox && <NavLink to="/inbox">Inbox</NavLink>}
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/products">Products &amp; Services</NavLink>
          <NavLink to="/marketing">Marketing</NavLink>
          {canProvision && <NavLink to="/people">Users</NavLink>}
          {isAdmin && <NavLink to="/settings">System Settings</NavLink>}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <strong>{user?.name}</strong>
            <span className="role-chip">{user?.role?.name}</span>
          </div>
          <button className="secondary" onClick={handleLogout}>Logout</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
