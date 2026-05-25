import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { DashboardPage } from './pages/DashboardPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { NurseOrderDetailPage } from './pages/NurseOrderDetailPage';

export function App() {
  const { token, actorId, login, logout } = useAuth();
  const navigate = useNavigate();

  const urqlClient = useMemo(() => (token ? createUrqlClient(token) : null), [token]);

  if (!token || !urqlClient) {
    return <LoginPage role="Nurse" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <AppShell
        appName="Nurse Station"
        actorName={actorId!}
        onProfile={() => navigate('/me')}
        onLogout={logout}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders/:orderId" element={<NurseOrderDetailPage />} />
          <Route path="/me" element={<ChangePasswordPage token={token} actorId={actorId!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
