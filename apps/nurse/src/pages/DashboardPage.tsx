import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { OrderStatusBadge, Spinner, LineList, STATUS_RANK, formatDate, SortIcon } from '@meditrack/ui';
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
    if (key === 'lines')     cmp = a.lines.length - b.lines.length;
    if (key === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    if (key === 'status')    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { wardUnitId } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showDelivered, setShowDelivered] = useState(false);

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

  if (!wardUnitId) return <p className="error-text">Error: Nurse account is not assigned to a ward unit.</p>;
  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const all = data?.wardUnit?.orders ?? [];
  const active    = sortOrders(all.filter((o: OrderRow) => o.status !== 'Delivered'), sortKey, sortDir);
  const delivered = sortOrders(all.filter((o: OrderRow) => o.status === 'Delivered'), 'createdAt', 'desc');

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggleSort(key)}>
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">Orders</h1>
        <Link to="/orders/new" className="btn btn-primary">+ New Order</Link>
      </div>

      <div className="card">
        {active.length === 0 ? (
          <div className="empty">No active orders. <Link to="/orders/new" className="linkbtn">Create one</Link> to get started.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                {th('Created', 'createdAt')}
                {th('Status', 'status')}
                {th('Medications', 'lines')}
              </tr>
            </thead>
            <tbody>
              {active.map(order => (
                <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td><LineList lines={order.lines} limit={3} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {delivered.length > 0 && (
        <>
          <button className="collapse-hd" onClick={() => setShowDelivered(v => !v)}>
            <span className={`caret${showDelivered ? ' open' : ''}`}>›</span>
            Delivered <span style={{ color: 'var(--faint)' }}>({delivered.length})</span>
          </button>
          {showDelivered && (
            <div className="card" style={{ opacity: .7 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no-sort">Created</th>
                    <th className="no-sort">Status</th>
                    <th className="no-sort">Medications</th>
                  </tr>
                </thead>
                <tbody>
                  {delivered.map(order => (
                    <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td><LineList lines={order.lines} limit={3} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
