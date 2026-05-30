import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from 'urql';
import { graphql } from './gql';

const STOCK_ALERT_SUB = graphql(`
  subscription PharmacistStockAlert {
    stockBelowThreshold {
      medicinalProductId productName stockLevel stockThreshold
    }
  }
`);

interface Alert {
  id: string;
  medicinalProductId: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
}

export function StockAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useSubscription({ query: STOCK_ALERT_SUB }, (prev, response) => {
    const event = response.stockBelowThreshold;
    if (event) {
      setAlerts(current => [{
        id: `${event.medicinalProductId}-${Date.now()}`,
        medicinalProductId: event.medicinalProductId,
        productName: event.productName,
        stockLevel: event.stockLevel,
        stockThreshold: event.stockThreshold,
      }, ...current].slice(0, 5));
    }
    return prev;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-fg)] flex items-center justify-between">
          <span>
            <Link
              to={`/inventory/${alert.medicinalProductId}`}
              className="font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {alert.productName}
            </Link>
            {' '}is below threshold ({alert.stockLevel}/{alert.stockThreshold})
          </span>
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
