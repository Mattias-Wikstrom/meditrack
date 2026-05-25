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
      medication {
        innName
        atcCode
        strength
      }
    }
    orders {
      id
      status
    }
  }
`;

type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'DELIVERED';

const ORDER_STATUSES: OrderStatus[] = ['DRAFT', 'SUBMITTED', 'CONFIRMED', 'DELIVERED'];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft Orders',
  SUBMITTED: 'Submitted Orders',
  CONFIRMED: 'Confirmed Orders',
  DELIVERED: 'Delivered Orders',
};

function StatCard({ title, value, subtitle, danger = false }: { title: string; value: number; subtitle: string; danger?: boolean }) {
  return (
    <Card className={`p-6 ${danger ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <span className={`text-xl ${danger ? 'text-red-500' : 'text-slate-400'}`}>{danger ? '⚠' : '•'}</span>
      </div>
      <div className={`mt-8 text-5xl font-semibold tabular-nums ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
      <p className="mt-2 text-slate-500">{subtitle}</p>
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
  orders: Array<{ id: string; status: OrderStatus }>;
};

export function OverviewPage() {
  const [{ data, fetching, error }] = useQuery<OverviewData>({ query: OVERVIEW_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const products = data?.medicinalProducts ?? [];
  const orders = data?.orders ?? [];

  const lowStock = products.filter((p) => p.isBelowThreshold);
  const pendingOrders = orders.filter((o) => o.status !== 'DELIVERED').length;

  const statusCounts = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Medications" value={products.length} subtitle="In drug registry" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} subtitle="Below minimum threshold" danger={lowStock.length > 0} />
        <StatCard title="Total Orders" value={orders.length} subtitle="All time orders" />
        <StatCard title="Pending Orders" value={pendingOrders} subtitle="Awaiting completion" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={`p-6 ${lowStock.length > 0 ? 'border-red-300' : ''}`}>
          <h3 className={`text-2xl font-semibold ${lowStock.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>⚠ Low Stock Alerts</h3>
          <p className="mt-2 text-slate-500">{lowStock.length} medication{lowStock.length === 1 ? '' : 's'} below minimum threshold</p>
          <div className="mt-4 space-y-3">
            {lowStock.length === 0 && <p className="text-slate-500">No low stock medications 🎉</p>}
            {lowStock.map((product) => (
              <div key={product.id} className="rounded-xl border border-red-200 bg-red-50/40 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{product.medication?.innName ?? product.productName}</div>
                  <div className="text-sm text-slate-500">{product.medication?.atcCode ?? '—'} · {product.medication?.strength ?? '—'}</div>
                </div>
                <div className="text-sm font-medium tabular-nums text-slate-700">
                  <span className="rounded-full bg-red-600 text-white px-2 py-1">{product.stockLevel}</span>
                  <span className="mx-2">→</span>
                  <span className="rounded-full border border-slate-300 px-2 py-1">{product.stockThreshold}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-slate-900">Quick Stats</h3>
          <dl className="mt-4 space-y-3">
            {ORDER_STATUSES.map((status) => (
              <div key={status} className="flex items-center justify-between text-slate-700">
                <dt>{ORDER_STATUS_LABELS[status]}</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{statusCounts[status]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
