// Used for / (nurse)
import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Button, Spinner } from '@meditrack/ui';
import { useAuth, useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const OVERVIEW_QUERY = graphql(`
  query NurseOverview($wardUnitId: ID!) {
    wardUnit(id: $wardUnitId) {
      orders { id status }
    }
  }
`);


const STATUS_ORDER = ['Draft', 'Sent', 'Confirmed', 'Delivered'] as const;

const STATUS_LABELS: Record<string, string> = {
  Draft:     'Draft',
  Sent:      'Submitted',
  Confirmed: 'Confirmed',
  Delivered: 'Delivered',
};

function StatCard({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <Card className="p-4">
      <span className={`text-2xl font-bold tabular-nums ${muted ? 'text-slate-400' : 'text-slate-900'}`}>
        {value}
      </span>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
    </Card>
  );
}

export function OverviewPage() {
  const { wardUnitId } = useAuth();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: OVERVIEW_QUERY,
    variables: { wardUnitId: wardUnitId ?? '' },
    pause: !wardUnitId,
    requestPolicy: 'cache-and-network',
  });

  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  if (!wardUnitId) return <p className="text-red-600 text-sm">Error: Nurse account is not assigned to a ward unit.</p>;
  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const orders = data?.wardUnit?.orders ?? [];
  const byStatus = (s: string) => orders.filter(o => o.status === s).length;
  const active = orders.filter(o => o.status !== 'Delivered').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {STATUS_ORDER.map(status => (
          <StatCard
            key={status}
            label={STATUS_LABELS[status]}
            value={byStatus(status)}
            muted={status === 'Delivered'}
          />
        ))}
      </div>

      <Card className="p-4">
        <dl className="space-y-1.5">
          <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-1.5">
            <dt className="text-slate-500">Active orders</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{active}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-slate-500">Total orders</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{orders.length}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <Link to="/orders/new">
          <Button>+ New Order</Button>
        </Link>
      </div>
    </div>
  );
}
