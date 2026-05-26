import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, MyAccountPage, TabNav } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { WardUnitsPage } from './pages/WardUnitsPage';
import { UserDetailsPage, WardUnitDetailsPage, MedicationDetailsPage } from './pages/DetailPages';
import { MedicationDetailPage } from './pages/MedicationDetailPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';
import { OverviewPage } from './pages/OverviewPage';

function AdminNav() {
  return (
    <TabNav
      items={[
        { to: '/', label: 'Overview', end: true },
        { to: '/orders', label: 'Orders' },
        { to: '/inventory', label: 'Inventory' },
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

  const urqlClient = useMemo(() => (token ? createUrqlClient(token, logout) : null), [token, logout]);

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
          <Route path="/" element={<OverviewPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/ward-units" element={<WardUnitsPage />} />
          <Route path="/ward-units/:wardUnitId" element={<WardUnitDetailsPage />} />
          <Route path="/users/:userId" element={<UserDetailsPage />} />
          <Route path="/inventory/:productId" element={<MedicationDetailsPage />} />
          <Route path="/medications/:medicationId" element={<MedicationDetailPage />} />
          <Route path="/orders/:orderId" element={<AdminOrderDetailPage />} />
          <Route path="/me" element={<MyAccountPage token={token} actorId={actorId!} role={role!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
