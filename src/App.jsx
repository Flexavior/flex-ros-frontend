import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import SsoCallback from './pages/SsoCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetailPage from './pages/LeadDetailPage.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetailPage from './pages/CustomerDetailPage.jsx';
import Products from './pages/Products.jsx';
import Marketing from './pages/Marketing.jsx';
import Settings from './pages/Settings.jsx';
import AdminConsole from './pages/AdminConsole.jsx';
import UserProvisioning from './pages/UserProvisioning.jsx';
import Inbox from './pages/Inbox.jsx';
import Documents from './pages/Documents.jsx';
import Layout from './components/Layout.jsx';
import {
  canUseCrmModules,
  canUseSalesCrmModules,
  INBOX_ROLES,
  isAdminUser,
} from './auth/crmAccess.js';

function CrmOperational({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }
  if (!canUseCrmModules(user)) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  return children;
}

function AdminDefaultIndex() {
  const { user } = useAuth();
  if (isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }
  return <Dashboard />;
}

function SalesCrmAccess({ children }) {
  const { user } = useAuth();

  if (!canUseSalesCrmModules(user)) {
    return (
      <div className="card" role="alert">
        <h1 className="page-title">Access unavailable</h1>
        <p>Leads and Customers are not available for your role.</p>
        <p className="kpi-sub">Contact your supervisor if you need access to this information.</p>
        <Link to="/">Return to dashboard</Link>
      </div>
    );
  }

  return children;
}

function Protected({ children, roles = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="card" style={{ margin: 24 }}>Loading session…</div>;
  }
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  if (roles && !roles.includes(user.role?.code)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/sso/callback" element={<SsoCallback />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<CrmOperational><AdminDefaultIndex /></CrmOperational>} />
        <Route path="/leads" element={<CrmOperational><SalesCrmAccess><Leads /></SalesCrmAccess></CrmOperational>} />
        <Route path="/leads/:id" element={<CrmOperational><SalesCrmAccess><LeadDetailPage /></SalesCrmAccess></CrmOperational>} />
        <Route path="/customers" element={<CrmOperational><SalesCrmAccess><Customers /></SalesCrmAccess></CrmOperational>} />
        <Route path="/customers/:id" element={<CrmOperational><SalesCrmAccess><CustomerDetailPage /></SalesCrmAccess></CrmOperational>} />
        <Route path="/documents" element={<CrmOperational><Documents /></CrmOperational>} />
        <Route path="/products" element={<CrmOperational><Products /></CrmOperational>} />
        <Route path="/marketing" element={<CrmOperational><Marketing /></CrmOperational>} />
        <Route
          path="/inbox"
          element={
            <CrmOperational>
              <Protected roles={INBOX_ROLES}>
                <Inbox />
              </Protected>
            </CrmOperational>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected roles={['admin']}>
              <AdminConsole />
            </Protected>
          }
        />
        <Route
          path="/people"
          element={
            <Protected roles={['admin', 'senior_management', 'ceo']}>
              <UserProvisioning />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected roles={['admin']}>
              <Settings />
            </Protected>
          }
        />
      </Route>
    </Routes>
  );
}
