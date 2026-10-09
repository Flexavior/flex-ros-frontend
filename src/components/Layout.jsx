import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { canUseCrmModules, INBOX_ROLES, isAdminUser } from '../auth/crmAccess.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);
  const showCrm = canUseCrmModules(user);
  const showInbox = showCrm && INBOX_ROLES.includes(user?.role?.code);
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
          {showCrm && (
            <>
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/leads">Leads</NavLink>
              {showInbox && <NavLink to="/inbox">Inbox</NavLink>}
              <NavLink to="/customers">Customers</NavLink>
              <NavLink to="/documents">Documents</NavLink>
              <NavLink to="/products">Products &amp; Services</NavLink>
              <NavLink to="/marketing">Marketing</NavLink>
            </>
          )}
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
