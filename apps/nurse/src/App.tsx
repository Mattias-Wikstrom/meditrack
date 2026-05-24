import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@meditrack/ui';
import { DashboardPage } from './pages/DashboardPage';
import { NewOrderPage } from './pages/NewOrderPage';

export function App() {
  return (
    <AppShell appName="Nurse Station" actorName="Anna Lindgren">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
      </Routes>
    </AppShell>
  );
}
