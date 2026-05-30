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
    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map(alert => (
        <div key={alert.id} className="stock-toast">
          <span>{alert.message}</span>
          <button
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
