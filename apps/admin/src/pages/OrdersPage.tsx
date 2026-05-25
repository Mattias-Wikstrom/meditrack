import { useState } from 'react';
import { useQuery } from 'urql';
import { Card, Badge, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const ORDERS_QUERY = graphql(`
  query AdminOrders {
    orders {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`);

type SortKey = 'createdAt' | 'status' | 'wardUnit' | 'lines';
type SortDir = 'asc' | 'desc';

const STATUS_RANK: Record<string, number> = { Draft: 0, Sent: 1, Confirmed: 2, Delivered: 3 };

type OrderRow = {
  id: string;
  wardUnitId: string;
  status: string;
  createdAt: string;
  lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[];
};

function sortOrders(orders: OrderRow[], key: SortKey, dir: SortDir): OrderRow[] {
  return [...orders].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'wardUnit':  cmp = a.wardUnitId.localeCompare(b.wardUnitId); break;
      case 'lines':     cmp = a.lines.length - b.lines.length; break;
      case 'createdAt': cmp = a.createdAt.localeCompare(b.createdAt); break;
      case 'status':    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-xs ${active ? 'text-slate-700' : 'invisible'}`}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const LINE_LIMIT = 3;

function LineList({ lines }: { lines: OrderRow['lines'] }) {
  const shown = lines.slice(0, LINE_LIMIT);
  const extra = lines.length - LINE_LIMIT;
  return (
    <div className="space-y-0.5">
      {shown.map(l => (
        <div key={l.medicationId} className="flex items-baseline gap-1.5">
          <span className="text-slate-700">{l.medication?.innName ?? l.medicationId}</span>
          <span className="text-slate-400 text-xs">×{l.quantity}</span>
        </div>
      ))}
      {extra > 0 && <div className="text-slate-400 text-xs">+{extra} more</div>}
    </div>
  );
}

export function OrdersPage() {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState('');

  const [{ data, fetching, error }] = useQuery({ query: ORDERS_QUERY, requestPolicy: 'cache-and-network' });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const all = data?.orders ?? [];
  const filtered = statusFilter ? all.filter(o => o.status === statusFilter) : all;
  const sorted = sortOrders(filtered, sortKey, sortDir);

  const th = (label: string, key: SortKey) => (
    <th
      className="text-left py-3 px-4 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap hover:text-slate-900"
      onClick={() => toggleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Orders
          <span className="ml-2 text-sm font-normal text-slate-400">{sorted.length}</span>
        </h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
            <tr className="border-b border-slate-200 bg-slate-50">
              {th('Created', 'createdAt')}
              {th('Status', 'status')}
              {th('Ward Unit', 'wardUnit')}
              {th('Medications', 'lines')}
              <th className="text-left py-3 px-4 font-medium text-slate-600">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(order => (
              <tr key={order.id} onClick={() => window.location.assign(`/orders/${order.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                <td className="py-3 px-4"><Badge status={order.status} /></td>
                <td className="py-3 px-4 text-slate-700">{order.wardUnitId}</td>
                <td className="py-3 px-4"><LineList lines={order.lines} /></td>
                <td className="py-3 px-4 text-slate-400 font-mono text-xs">{order.id}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
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
