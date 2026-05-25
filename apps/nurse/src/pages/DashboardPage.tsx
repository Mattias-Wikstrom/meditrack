import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { Button, Spinner } from '@meditrack/ui';
import { useAuth } from '@meditrack/client';
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

const ORDER_DRAFT_CREATED_SUB = graphql(`
  subscription NurseOrderDraftCreated {
    orderDraftCreated { orderId }
  }
`);

const ORDER_DRAFT_UPDATED_SUB = graphql(`
  subscription NurseOrderDraftUpdated {
    orderDraftUpdated { orderId }
  }
`);

const ORDER_STATUS_SUB = graphql(`
  subscription NurseOrderStatusChanged {
    orderStatusChanged { orderId from to }
  }
`);

type SortKey = 'status' | 'lines' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_RANK: Record<string, number> = { Draft: 0, Sent: 1, Confirmed: 2, Delivered: 3 };

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-xs ${active ? 'text-slate-700' : 'invisible'}`}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Draft:     'bg-slate-100 text-slate-600',
  Sent:      'bg-blue-100 text-blue-700',
  Confirmed: 'bg-amber-100 text-amber-700',
  Delivered: 'bg-green-100 text-green-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
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
        <tr className="border-b border-slate-200">
          {cols.map(c => (
            <th key={c.key}
              onClick={sortable ? () => onSort(c.key) : undefined}
              className={`text-left py-2 px-4 font-medium text-slate-500 select-none whitespace-nowrap ${sortable ? 'cursor-pointer' : ''}`}>
              {c.label}
              {sortable && <SortIcon active={sortKey === c.key} dir={sortDir} />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id} onClick={() => onRowClick(order.id)}
            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
            <td className="py-2.5 px-4 align-top text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
            <td className="py-2.5 px-4 align-top"><StatusBadge status={order.status} /></td>
            <td className="py-2.5 px-4 align-top"><LineList lines={order.lines} /></td>
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

  function handleSub() { refetch({ requestPolicy: 'network-only' }); return undefined; }
  useSubscription({ query: ORDER_DRAFT_CREATED_SUB }, handleSub);
  useSubscription({ query: ORDER_DRAFT_UPDATED_SUB }, handleSub);
  useSubscription({ query: ORDER_STATUS_SUB }, handleSub);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (!wardUnitId) return <p className="text-red-600 text-sm">Error: Nurse account is not assigned to a ward unit.</p>;
  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const all = data?.wardUnit?.orders ?? [];
  const active    = sortOrders(all.filter(o => o.status !== 'Delivered'), sortKey, sortDir);
  const delivered = sortOrders(all.filter(o => o.status === 'Delivered'), 'createdAt', 'desc');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Orders</h1>
        <Link to="/orders/new"><Button>+ New Order</Button></Link>
      </div>

      {active.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-16">No active orders. Create one to get started.</p>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <OrderTable orders={active} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} onRowClick={id => navigate(`/orders/${id}`)} />
        </div>
      )}

      {delivered.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-600 transition-colors select-none">
            Delivered ({delivered.length})
          </summary>
          <div className="mt-2 bg-white rounded-lg border border-slate-200 overflow-hidden opacity-60">
            <OrderTable orders={delivered} sortKey='createdAt' sortDir='desc' onSort={() => {}} onRowClick={id => navigate(`/orders/${id}`)} sortable={false} />
          </div>
        </details>
      )}
    </div>
  );
}
