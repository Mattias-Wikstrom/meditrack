// Used for /orders/:orderId (admin)
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { PageHeader, OrderStatusBadge, Card, Spinner, formatDateTime } from '@meditrack/ui';
import { useRefetchOn } from '@meditrack/client';

const ORDER_DETAIL_QUERY = `
  query AdminOrderDetail($id: ID!) {
    order(id: $id) {
      id wardUnitId wardUnit { name } status createdAt
      lines {
        medicationId quantity
        medication { innName }
      }
    }
  }
`;

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: ORDER_DETAIL_QUERY,
    variables: { id: orderId },
    requestPolicy: 'network-only',
  });
  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const order = data?.order;
  if (!order) return (
    <p className="text-sm text-[var(--muted)]">
      Order not found.{' '}
      <a className="text-accent hover:underline" href="/orders">Back to list</a>.
    </p>
  );

  return (
    <div className="max-w-xl">
      <PageHeader onBack={() => navigate('/orders')} className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          Order <span className="font-mono text-base">{order.id.slice(0, 8)}…</span>
        </h1>
        <OrderStatusBadge status={order.status} />
      </PageHeader>

      <Card className="p-5 mb-4">
        <dl className="text-sm space-y-0">
          <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--border)]">
            <dt className="text-[var(--muted)]">Ward Unit</dt>
            <dd>
              <Link to={`/ward-units/${order.wardUnitId}`} className="text-accent hover:underline">
                {order.wardUnit?.name ?? order.wardUnitId}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--border)]">
            <dt className="text-[var(--muted)]">Created</dt>
            <dd className="text-[var(--text)]">{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between items-baseline py-2.5">
            <dt className="text-[var(--muted)]">Order ID</dt>
            <dd className="font-mono text-xs text-[var(--faint)]">{order.id}</dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tint)] text-left">
              <th className="px-5 py-3 font-medium text-[var(--text)]">Medication</th>
              <th className="px-5 py-3 font-medium text-[var(--text)] text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: { medicationId: string; quantity: number; medication?: { innName: string } | null }) => (
              <tr key={line.medicationId} className="border-b border-[var(--border)] last:border-0">
                <td className="px-5 py-3 text-[var(--ink)]">{line.medication?.innName ?? line.medicationId}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-[var(--text)]">{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
