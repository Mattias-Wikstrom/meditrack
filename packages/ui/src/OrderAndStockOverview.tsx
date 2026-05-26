import { Link } from 'react-router-dom';
import { Card } from './Card';

export interface OverviewProduct {
  id: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
  isBelowThreshold: boolean;
  medication?: { innName: string; atcCode: string; strength: string } | null;
}

export interface OverviewOrder {
  id: string;
  status: string;
}

export interface OrderAndStockOverviewProps {
  products: OverviewProduct[];
  orders: OverviewOrder[];
  /** If provided, low-stock items become links to this href */
  getProductHref?: (productId: string) => string;
  /** href for the "Total Medications" stat card */
  inventoryHref?: string;
  /** href for the "Low Stock Alerts" stat card (inventory sorted so low-stock items appear first) */
  lowStockHref?: string;
  /** href for the "Total Orders" stat card */
  ordersHref?: string;
}

const ORDER_STATUSES = ['Draft', 'Sent', 'Confirmed', 'Delivered'] as const;

const ORDER_STATUS_LABELS: Record<string, string> = {
  Draft:     'Draft Orders',
  Sent:      'Submitted Orders',
  Confirmed: 'Confirmed Orders',
  Delivered: 'Delivered Orders',
};

function StatCard({ title, value, subtitle, danger = false, href }: {
  title: string; value: number; subtitle: string; danger?: boolean; href?: string;
}) {
  const card = (
    <Card className={`p-3 ${danger ? 'border-red-300' : ''}${href ? ' hover:bg-slate-50 transition-colors' : ''}`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-bold tabular-nums ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
        {danger && <span className="text-red-400 text-sm">⚠</span>}
      </div>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </Card>
  );
  return href ? <Link to={href} className="block">{card}</Link> : card;
}

export function OrderAndStockOverview({ products, orders, getProductHref, inventoryHref, lowStockHref, ordersHref }: OrderAndStockOverviewProps) {
  const lowStock = products.filter(p => p.isBelowThreshold);
  const pendingOrders = orders.filter(o => o.status !== 'Delivered').length;
  const byStatus = (s: string) => orders.filter(o => o.status === s).length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-4">
        <StatCard title="Total Medications" value={products.length} subtitle="In drug registry" href={inventoryHref} />
        <StatCard title="Low Stock Alerts" value={lowStock.length} subtitle="Below minimum threshold" danger={lowStock.length > 0} href={lowStockHref} />
        <StatCard title="Total Orders" value={orders.length} subtitle="All time orders" href={ordersHref} />
        <StatCard title="Pending Orders" value={pendingOrders} subtitle="Awaiting completion" />
      </div>

      <div className="grid gap-3 grid-cols-2">
        <Card className={`p-3 ${lowStock.length > 0 ? 'border-red-300' : ''}`}>
          <h3 className={`text-sm font-semibold mb-0.5 ${lowStock.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            ⚠ Low Stock Alerts
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            {lowStock.length} medication{lowStock.length === 1 ? '' : 's'} below minimum threshold
          </p>
          <div className="space-y-1.5">
            {lowStock.length === 0 && <p className="text-sm text-slate-400">No low stock medications.</p>}
            {lowStock.map(product => {
              const inner = (
                <>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{product.productName}</div>
                    <div className="text-xs text-slate-500">{product.medication?.innName ?? '—'} · {product.medication?.atcCode ?? '—'} · {product.medication?.strength ?? '—'}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
                    <span className="rounded-full bg-red-600 text-white px-2 py-0.5">{product.stockLevel}</span>
                    <span className="text-slate-400">→</span>
                    <span className="rounded-full border border-slate-300 text-slate-600 px-2 py-0.5">{product.stockThreshold}</span>
                  </div>
                </>
              );

              const className = 'flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 hover:bg-red-100 transition-colors';

              return getProductHref ? (
                <Link key={product.id} to={getProductHref(product.id)} className={className}>
                  {inner}
                </Link>
              ) : (
                <div key={product.id} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Quick Stats</h3>
          <dl className="space-y-1.5">
            {ORDER_STATUSES.map(status => (
              <div key={status} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
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
