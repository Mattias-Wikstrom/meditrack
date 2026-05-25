import { Link } from 'react-router-dom';
import { Card, Spinner } from '@meditrack/ui';
import { useQuery } from 'urql';

const OVERVIEW_QUERY = `
  query AdminOverview {
    medicinalProducts {
      id
      productName
      stockLevel
      stockThreshold
      isBelowThreshold
      medication { innName atcCode strength }
    }
    orders { id status }
  }
`;

type OrderStatus = 'Draft' | 'Sent' | 'Confirmed' | 'Delivered';

const ORDER_STATUSES: OrderStatus[] = ['Draft', 'Sent', 'Confirmed', 'Delivered'];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Draft:     'Draft Orders',
  Sent:      'Submitted Orders',
  Confirmed: 'Confirmed Orders',
  Delivered: 'Delivered Orders',
};

function StatCard({ title, value, subtitle, danger = false }: { title: string; value: number; subtitle: string; danger?: boolean }) {
  return (
    <Card className={`p-4 ${danger ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold text-slate-700">{title}</h2>
        <span className={`text-base ${danger ? 'text-red-500' : 'text-slate-300'}`}>{danger ? '⚠' : '◻'}</span>
      </div>
      <div className={`mt-4 text-3xl font-bold tabular-nums ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </Card>
  );
}

type OverviewData = {
  medicinalProducts: Array<{
    id: string;
    productName: string;
    stockLevel: number;
    stockThreshold: number;
    isBelowThreshold: boolean;
    medication?: { innName: string; atcCode: string; strength: string } | null;
  }>;
  orders: Array<{ id: string; status: string }>;
};

export function OverviewPage() {
  const [{ data, fetching, error }] = useQuery<OverviewData>({ query: OVERVIEW_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const products = data?.medicinalProducts ?? [];
  const orders = data?.orders ?? [];

  const lowStock = products.filter((p) => p.isBelowThreshold);
  const pendingOrders = orders.filter((o) => o.status !== 'Delivered').length;
  const byStatus = (s: string) => orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-4">
        <StatCard title="Total Medications" value={products.length} subtitle="In drug registry" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} subtitle="Below minimum threshold" danger={lowStock.length > 0} />
        <StatCard title="Total Orders" value={orders.length} subtitle="All time orders" />
        <StatCard title="Pending Orders" value={pendingOrders} subtitle="Awaiting completion" />
      </div>

      <div className="grid gap-3 grid-cols-2">
        <Card className={`p-4 ${lowStock.length > 0 ? 'border-red-300' : ''}`}>
          <h3 className={`text-base font-semibold mb-1 ${lowStock.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            ⚠ Low Stock Alerts
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            {lowStock.length} medication{lowStock.length === 1 ? '' : 's'} below minimum threshold
          </p>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-sm text-slate-400">No low stock medications.</p>}
            {lowStock.map((product) => (
              <Link
                key={product.id}
                to={`/medications/${product.id}`}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 hover:bg-red-100 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{product.medication?.innName ?? product.productName}</div>
                  <div className="text-xs text-slate-500">{product.medication?.atcCode ?? '—'} · {product.medication?.strength ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
                  <span className="rounded-full bg-red-600 text-white px-2 py-0.5">{product.stockLevel}</span>
                  <span className="text-slate-400">→</span>
                  <span className="rounded-full border border-slate-300 text-slate-600 px-2 py-0.5">{product.stockThreshold}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Quick Stats</h3>
          <dl className="space-y-3">
            {ORDER_STATUSES.map((status) => (
              <div key={status} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <dt className="text-slate-500">{ORDER_STATUS_LABELS[status]}</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{byStatus(status)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
