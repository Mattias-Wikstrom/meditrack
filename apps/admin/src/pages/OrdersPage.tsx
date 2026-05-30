// Used for /orders (admin)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { useRefetchOn } from '@meditrack/client';
import { Card, OrderStatusBadge, Spinner, SortIcon, LineList, STATUS_RANK, formatDate } from '@meditrack/ui';
import { graphql } from '../gql';

const ORDERS_QUERY = graphql(`
  query AdminOrders {
    orders {
      id wardUnitId wardUnit { name } status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`);

type SortKey = 'createdAt' | 'status' | 'wardUnit' | 'lines';
type SortDir = 'asc' | 'desc';

type OrderRow = {
  id: string;
  wardUnitId: string;
  wardUnit?: { name: string } | null;
  status: string;
  createdAt: string;
  lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[];
};

function sortOrders(orders: OrderRow[], key: SortKey, dir: SortDir): OrderRow[] {
  return [...orders].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'wardUnit':  cmp = (a.wardUnit?.name ?? a.wardUnitId).localeCompare(b.wardUnit?.name ?? b.wardUnitId); break;
      case 'lines':     cmp = a.lines.length - b.lines.length; break;
      case 'createdAt': cmp = a.createdAt.localeCompare(b.createdAt); break;
      case 'status':    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState('');

  const [{ data, fetching, error }, refetch] = useQuery({ query: ORDERS_QUERY, requestPolicy: 'cache-and-network' });
  useRefetchOn(['Order', 'WardUnit'], () => refetch({ requestPolicy: 'network-only' }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const all = data?.orders ?? [];
  const filtered = statusFilter ? all.filter(o => o.status === statusFilter) : all;
  const sorted = sortOrders(filtered, sortKey, sortDir);

  const th = (label: string, key: SortKey) => (
    <th
      className="text-left py-3 px-4 font-medium text-[var(--text)] cursor-pointer select-none whitespace-nowrap hover:text-[var(--ink)]"
      onClick={() => toggleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          Orders
          <span className="ml-2 text-sm font-normal text-[var(--faint)]">{sorted.length}</span>
        </h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tint)]">
              {th('Created', 'createdAt')}
              {th('Status', 'status')}
              {th('Ward Unit', 'wardUnit')}
              {th('Medications', 'lines')}
              <th className="text-left py-3 px-4 font-medium text-[var(--text)]">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(order => (
              <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer">
                <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">{formatDate(order.createdAt)}</td>
                <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                <td className="py-3 px-4">
                  <Link to={`/ward-units/${order.wardUnitId}`} onClick={e => e.stopPropagation()} className="text-accent hover:underline">
                    {order.wardUnit?.name ?? order.wardUnitId}
                  </Link>
                </td>
                <td className="py-3 px-4"><LineList lines={order.lines} limit={3} /></td>
                <td className="py-3 px-4 text-[var(--faint)] font-mono text-xs">{order.id}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[var(--faint)]">
                  {statusFilter ? `No ${statusFilter.toLowerCase()} orders.` : 'No orders found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
