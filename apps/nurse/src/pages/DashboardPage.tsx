// Used for /orders (nurse)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { OrderStatusBadge, Button, Spinner, SortIcon, LineList, STATUS_RANK, formatDate } from '@meditrack/ui';
import { useAuth, useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const WARD_UNIT_ORDERS_QUERY = graphql(`
  query NurseWardUnitOrders($wardUnitId: ID!) {
    wardUnit(id: $wardUnitId) {
      id
      orders {
        id status createdAt
        lines { medicationId quantity medication { innName } }
      }
    }
  }
`);



type SortKey = 'status' | 'lines' | 'createdAt';
type SortDir = 'asc' | 'desc';

type OrderRow = {
  id: string;
  status: string;
  createdAt: string;
  lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[];
};

function sortOrders(orders: OrderRow[], key: SortKey, dir: SortDir): OrderRow[] {
  return [...orders].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'lines':     cmp = a.lines.length - b.lines.length; break;
      case 'createdAt': cmp = a.createdAt.localeCompare(b.createdAt); break;
      case 'status':    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function OrderTable({ orders, sortKey, sortDir, onSort, onRowClick, sortable = true }: {
  orders: OrderRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onRowClick: (id: string) => void;
  sortable?: boolean;
}) {
  const cols: { key: SortKey; label: string }[] = [
    { key: 'createdAt', label: 'Created' },
    { key: 'status',    label: 'Status' },
    { key: 'lines',     label: 'Medications' },
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border)]">
          {cols.map(c => (
            <th key={c.key}
              onClick={sortable ? () => onSort(c.key) : undefined}
              className={`text-left py-2 px-4 font-medium text-[var(--muted)] select-none whitespace-nowrap ${sortable ? 'cursor-pointer' : ''}`}>
              {c.label}
              {sortable && <SortIcon active={sortKey === c.key} dir={sortDir} />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id} onClick={() => onRowClick(order.id)}
            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer transition-colors">
            <td className="py-2.5 px-4 align-top text-[var(--muted)] whitespace-nowrap">{formatDate(order.createdAt)}</td>
            <td className="py-2.5 px-4 align-top"><OrderStatusBadge status={order.status} /></td>
            <td className="py-2.5 px-4 align-top"><LineList lines={order.lines} limit={3} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { wardUnitId } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [{ data, fetching, error }, refetch] = useQuery({
    query: WARD_UNIT_ORDERS_QUERY,
    variables: { wardUnitId: wardUnitId ?? '' },
    pause: !wardUnitId,
    requestPolicy: 'cache-and-network',
  });

  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (!wardUnitId) return <p className="text-[var(--danger)] text-sm">Error: Nurse account is not assigned to a ward unit.</p>;
  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const all = data?.wardUnit?.orders ?? [];
  const active    = sortOrders(all.filter(o => o.status !== 'Delivered'), sortKey, sortDir);
  const delivered = sortOrders(all.filter(o => o.status === 'Delivered'), 'createdAt', 'desc');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Orders</h1>
        <Link to="/orders/new"><Button>+ New Order</Button></Link>
      </div>

      {active.length === 0 ? (
        <p className="text-[var(--faint)] text-sm text-center py-16">No active orders. Create one to get started.</p>
      ) : (
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
          <OrderTable orders={active} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} onRowClick={id => navigate(`/orders/${id}`)} />
        </div>
      )}

      {delivered.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-[var(--faint)] hover:text-[var(--text)] transition-colors select-none">
            Delivered ({delivered.length})
          </summary>
          <div className="mt-2 bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden opacity-60">
            <OrderTable orders={delivered} sortKey='createdAt' sortDir='desc' onSort={() => {}} onRowClick={id => navigate(`/orders/${id}`)} sortable={false} />
          </div>
        </details>
      )}
    </div>
  );
}
