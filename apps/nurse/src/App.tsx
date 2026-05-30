import { useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Provider, useQuery } from 'urql';
import { AppShell, LoginPage, MyAccountPage, TabNav } from '@meditrack/ui';
import { useAuth, createUrqlClient, RepositorySync, useRefetchOn } from '@meditrack/client';
import { OverviewPage } from './pages/OverviewPage';
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

  const [{ data }, refetch] = useQuery({ query: WARD_UNIT_NAME_QUERY, variables: { id: wardUnitId }, pause: !wardUnitId });
  const wardUnitName = data?.wardUnit?.name;
  useRefetchOn('WardUnit', () => refetch({ requestPolicy: 'network-only' }));

  return (
    <AppShell
      appName="Nurse Station"
      actorName={actorId}
      context={wardUnitName}
      appRole={role}
      onHome={() => navigate('/')}
      onProfile={() => navigate('/me')}
      onLogout={logout}
      nav={<TabNav items={[{ to: '/', label: 'Overview', end: true }, { to: '/orders', label: 'Orders' }]} />}
    >
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/orders" element={<DashboardPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/orders/:orderId" element={<NurseOrderDetailPage />} />
        <Route
          path="/me"
          element={
            <MyAccountPage
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
  const { token, actorId, wardUnitId, role, login, logout } = useAuth();
  const urqlClient = useMemo(() => (token ? createUrqlClient(token, logout) : null), [token, logout]);

  if (!token || !urqlClient) {
    return <LoginPage role="Nurse" appName="Nurse Station" onLogin={login} />;
  }

  return (
    <Provider value={urqlClient}>
      <RepositorySync />
      <NurseShell token={token} actorId={actorId!} wardUnitId={wardUnitId ?? ''} role={role!} />
    </Provider>
  );
}
