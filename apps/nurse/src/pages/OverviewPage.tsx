import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Spinner, OrderStatusBadge, formatDate } from '@meditrack/ui';
import { useAuth, useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const OVERVIEW_QUERY = graphql(`
  query NurseOverview($wardUnitId: ID!) {
    wardUnit(id: $wardUnitId) {
      orders {
        id status createdAt
        lines { medicationId quantity medication { innName } }
      }
    }
  }
`);

const STATUS_ORDER = ['Draft', 'Sent', 'Confirmed', 'Delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft', Sent: 'Submitted', Confirmed: 'Confirmed', Delivered: 'Delivered',
};

export function OverviewPage() {
  const { wardUnitId } = useAuth();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: OVERVIEW_QUERY,
    variables: { wardUnitId: wardUnitId ?? '' },
    pause: !wardUnitId,
    requestPolicy: 'cache-and-network',
  });

  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  if (!wardUnitId) return <p className="error-text">Error: Nurse account is not assigned to a ward unit.</p>;
  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const orders = data?.wardUnit?.orders ?? [];
  type Order = { id: string; status: string; createdAt: string; lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[] };
  const byStatus = (s: string) => orders.filter((o: Order) => o.status === s).length;
  const active = orders.filter((o: Order) => o.status !== 'Delivered');

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">Overview</h1>
        <Link to="/orders/new" className="btn btn-primary">+ New Order</Link>
      </div>

      <div className="tiles">
        {STATUS_ORDER.map(status => (
          <div key={status} className={`tile${status === 'Sent' && byStatus(status) > 0 ? ' accent' : ''}`}>
            <div className="tval">{byStatus(status)}</div>
            <div className="tlabel">{STATUS_LABELS[status]}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="card-hd">
          <h2 className="h2">In progress</h2>
          <span className="subtle">{active.length} active · {orders.length} total</span>
        </div>
        <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {active.length === 0 ? (
            <div className="empty">No active orders. Everything has been delivered.</div>
          ) : (
            active.map((o: Order) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="line" style={{ textDecoration: 'none' }}>
                <div>
                  <div className="lname">{o.lines.map((l: Order['lines'][number]) => l.medication?.innName ?? l.medicationId).join(', ')}</div>
                  <div className="lmeta">{formatDate(o.createdAt)} · {o.lines.length} medication{o.lines.length > 1 ? 's' : ''}</div>
                </div>
                <OrderStatusBadge status={o.status} />
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
