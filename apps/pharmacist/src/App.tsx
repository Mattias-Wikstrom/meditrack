import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, MyAccountPage, TabNav } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryProductPage } from './pages/InventoryProductPage';
import { MedicationDetailPage } from './pages/MedicationDetailPage';
import { StockAlerts } from './StockAlerts';

function PharmacistNav() {
  return (
    <TabNav
      items={[
        { to: '/', label: 'Overview', end: true },
        { to: '/orders', label: 'Orders' },
        { to: '/inventory', label: 'Inventory' },
      ]}
    />
  );
}

export function App() {
  const { token, actorId, role, login, logout } = useAuth();
  const navigate = useNavigate();

  const urqlClient = useMemo(() => (token ? createUrqlClient(token, logout) : null), [token, logout]);

  if (!token || !urqlClient) {
    return <LoginPage role="Pharmacist" appName="Pharmacy" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <AppShell
        appName="Pharmacy"
        actorName={actorId!}
        nav={<PharmacistNav />}
        onHome={() => navigate('/')}
        onProfile={() => navigate('/me')}
        onLogout={logout}
      >
        <StockAlerts />
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/orders" element={<DashboardPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/:productId" element={<InventoryProductPage />} />
          <Route path="/medications/:medicationId" element={<MedicationDetailPage />} />
          <Route path="/me" element={<MyAccountPage token={token} actorId={actorId!} role={role!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
