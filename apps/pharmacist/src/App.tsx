import { useMemo } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrderDetailPage } from './pages/OrderDetailPage';

function PharmacistNav() {
  return (
    <nav className="flex gap-1">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            isActive
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`
        }
      >
        Orders
      </NavLink>
      <NavLink
        to="/inventory"
        className={({ isActive }) =>
          `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            isActive
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`
        }
      >
        Inventory
      </NavLink>
    </nav>
  );
}

export function App() {
  const { token, actorId, role, login, logout } = useAuth();
  const navigate = useNavigate();

  const urqlClient = useMemo(() => (token ? createUrqlClient(token) : null), [token]);

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
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/me" element={<ChangePasswordPage token={token} actorId={actorId!} role={role!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
