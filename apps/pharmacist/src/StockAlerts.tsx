import { useState } from 'react';
import { useSubscription } from 'urql';
import { graphql } from './gql';

const STOCK_ALERT_SUB = graphql(`
  subscription PharmacistStockAlert {
    stockBelowThreshold {
      medicinalProductId productName stockLevel stockThreshold
    }
  }
`);

export function StockAlerts() {
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string }>>([]);

  useSubscription({ query: STOCK_ALERT_SUB }, (prev, response) => {
    const event = response.stockBelowThreshold;
    if (event) {
      const alertId = `${event.medicinalProductId}-${Date.now()}`;
      const message = `${event.productName} is below threshold (${event.stockLevel}/${event.stockThreshold})`;
      setAlerts(current => [{ id: alertId, message }, ...current].slice(0, 5));
    }
    return prev;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-fg)] flex items-center justify-between">
          <span>{alert.message}</span>
          <button
            className="ml-3 text-[var(--danger)] hover:text-[var(--danger-fg)]"
            onClick={() => setAlerts(current => current.filter(a => a.id !== alert.id))}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
