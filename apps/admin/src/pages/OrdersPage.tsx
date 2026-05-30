import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { useRefetchOn } from '@meditrack/client';
import { OrderStatusBadge, Spinner, SortIcon, LineList, STATUS_RANK, formatDate } from '@meditrack/ui';
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
    if (key === 'wardUnit')  cmp = (a.wardUnit?.name ?? a.wardUnitId).localeCompare(b.wardUnit?.name ?? b.wardUnitId);
    if (key === 'lines')     cmp = a.lines.length - b.lines.length;
    if (key === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    if (key === 'status')    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
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

  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const all: OrderRow[] = data?.orders ?? [];
  const filtered = statusFilter ? all.filter((o: OrderRow) => o.status === statusFilter) : all;
  const sorted = sortOrders(filtered, sortKey, sortDir);

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggleSort(key)}>
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">Orders <span className="count" style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 20 }}>{sorted.length}</span></h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              {th('Created', 'createdAt')}
              {th('Status', 'status')}
              {th('Ward Unit', 'wardUnit')}
              {th('Medications', 'lines')}
              <th className="no-sort">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(order => (
              <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td>
                  <Link to={`/ward-units/${order.wardUnitId}`} className="link-cell" onClick={e => e.stopPropagation()}>
                    {order.wardUnit?.name ?? order.wardUnitId}
                  </Link>
                </td>
                <td><LineList lines={order.lines} limit={3} /></td>
                <td><span className="mono minicode">{order.id.slice(0, 12)}…</span></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty">{statusFilter ? `No ${statusFilter.toLowerCase()} orders.` : 'No orders found.'}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
