import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage, TabNav } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { OrdersPage } from './pages/OrdersPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { WardUnitsPage } from './pages/WardUnitsPage';
import { UserDetailsPage, WardUnitDetailsPage, MedicationDetailsPage, OrderDetailsPage } from './pages/DetailPages';

function AdminNav() {
  return (
    <TabNav
      items={[
        { to: '/', label: 'Overview', end: true },
        { to: '/orders', label: 'Orders' },
        { to: '/medications', label: 'Medications' },
        { to: '/users', label: 'Users' },
        { to: '/audit', label: 'Audit' },
        { to: '/ward-units', label: 'Ward Units' },
      ]}
    />
  );
}

export function App() {
  const { token, actorId, role, login, logout } = useAuth();
  const navigate = useNavigate();

  const urqlClient = useMemo(() => (token ? createUrqlClient(token) : null), [token]);

  if (!token || !urqlClient) {
    return <LoginPage role="Admin" appName="Admin" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <AppShell
        appName="Admin"
        actorName={actorId!}
        nav={<AdminNav />}
        onHome={() => navigate('/')}
        onProfile={() => navigate('/me')}
        onLogout={logout}
      >
        <Routes>
          <Route path="/" element={<div className="text-sm text-slate-600">Overview</div>} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/ward-units" element={<WardUnitsPage />} />
          <Route path="/ward-units/:wardUnitId" element={<WardUnitDetailsPage />} />
          <Route path="/users/:userId" element={<UserDetailsPage />} />
          <Route path="/medications/:productId" element={<MedicationDetailsPage />} />
          <Route path="/orders/:wardUnitId" element={<OrderDetailsPage />} />
          <Route path="/me" element={<ChangePasswordPage token={token} actorId={actorId!} role={role!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
