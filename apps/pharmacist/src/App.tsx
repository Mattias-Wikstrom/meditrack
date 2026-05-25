import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { DashboardPage } from './pages/DashboardPage';
import { OrderDetailPage } from './pages/OrderDetailPage';

export function App() {
  const { token, actorId, login, logout } = useAuth();
  const navigate = useNavigate();

  const urqlClient = useMemo(() => (token ? createUrqlClient(token) : null), [token]);

  if (!token || !urqlClient) {
    return <LoginPage role="Pharmacist" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <AppShell
        appName="Pharmacy"
        actorName={actorId!}
        onProfile={() => navigate('/me')}
        onLogout={logout}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/me" element={<ChangePasswordPage token={token} actorId={actorId!} onSuccess={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
