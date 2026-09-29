import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Products from './pages/Products.jsx';
import Marketing from './pages/Marketing.jsx';
import Settings from './pages/Settings.jsx';
import Inbox from './pages/Inbox.jsx';
import Layout from './components/Layout.jsx';

const INBOX_ROLES = ['customer_service', 'sales', 'staff', 'senior_staff', 'supervisor', 'senior_management', 'ceo', 'admin'];

function Protected({ children, roles = null }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role?.code)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route
          path="/inbox"
          element={
            <Protected roles={INBOX_ROLES}>
              <Inbox />
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
