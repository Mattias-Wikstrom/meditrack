import { useMemo } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { Provider } from 'urql';
import { AppShell, LoginPage, ChangePasswordPage } from '@meditrack/ui';
import { useAuth, createUrqlClient } from '@meditrack/client';
import { OrdersPage } from './pages/OrdersPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { WardUnitsPage } from './pages/WardUnitsPage';

function AdminNav() {
  const link = (to: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          isActive
            ? 'border-accent text-accent'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="flex gap-1">
      {link('/', 'Orders', true)}
      {link('/medications', 'Medications')}
      {link('/users', 'Users')}
      {link('/audit', 'Audit')}
      {link('/ward-units', 'Ward Units')}
    </nav>
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
          <Route path="/" element={<OrdersPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/ward-units" element={<WardUnitsPage />} />
          <Route path="/me" element={<ChangePasswordPage token={token} actorId={actorId!} role={role!} onSuccess={() => navigate('/')} onCancel={() => navigate('/')} />} />
        </Routes>
      </AppShell>
    </Provider>
  );
}
