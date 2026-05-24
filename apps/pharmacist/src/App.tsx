import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@meditrack/ui';
import { DashboardPage } from './pages/DashboardPage';
import { OrderDetailPage } from './pages/OrderDetailPage';

export function App() {
  return (
    <AppShell appName="Pharmacy" actorName="Sofia Eriksson">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </AppShell>
  );
}
