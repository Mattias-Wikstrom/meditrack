import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider, useQuery } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage, TabNav } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { DashboardPage } from './pages/DashboardPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { NurseOrderDetailPage } from './pages/NurseOrderDetailPage';
import { graphql } from './gql';

const WARD_UNIT_NAME_QUERY = graphql(`
  query NurseWardUnitName($id: ID!) {
    wardUnit(id: $id) { id name }
  }
`);

function NurseShell({ token, actorId, wardUnitId, role }: { token: string; actorId: string; wardUnitId: string; role: string }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [{ data }] = useQuery({ query: WARD_UNIT_NAME_QUERY, variables: { id: wardUnitId } });
  const wardUnitName = data?.wardUnit?.name ?? wardUnitId;

  return (
    <AppShell
      appName="Nurse Station"
      actorName={actorId}
      context={wardUnitName}
      onHome={() => navigate('/')}
      onProfile={() => navigate('/me')}
      onLogout={logout}
      nav={<TabNav items={[{ to: '/', label: 'Overview', end: true }, { to: '/orders/new', label: 'Orders' }]} />}
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/orders/:orderId" element={<NurseOrderDetailPage />} />
        <Route
          path="/me"
          element={
            <ChangePasswordPage
              token={token}
              actorId={actorId}
              role={role}
              wardUnitName={wardUnitName}
              onSuccess={() => navigate('/')}
              onCancel={() => navigate('/')}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}

export function App() {
  const { token, actorId, wardUnitId, role, login } = useAuth();
  const urqlClient = useMemo(() => (token ? createUrqlClient(token) : null), [token]);

  if (!token || !urqlClient) {
    return <LoginPage role="Nurse" appName="Nurse Station" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <NurseShell token={token} actorId={actorId!} wardUnitId={wardUnitId ?? ''} role={role!} />
    </Provider>
  );
}
