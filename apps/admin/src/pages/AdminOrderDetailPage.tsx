import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { BackButton, Badge, Card, Spinner } from '@meditrack/ui';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [{ data, fetching, error }] = useQuery({
    query: ORDER_DETAIL_QUERY,
    variables: { id: orderId },
    requestPolicy: 'network-only',
  });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const order = data?.order;
  if (!order) return (
    <p className="text-sm text-slate-500">
      Order not found.{' '}
      <a className="text-accent hover:underline" href="/orders">Back to list</a>.
    </p>
  );

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => navigate('/orders')} />
        <h1 className="text-xl font-semibold text-slate-800">
          Order <span className="font-mono text-base">{order.id.slice(0, 8)}…</span>
        </h1>
        <Badge status={order.status} />
      </div>

      <Card className="p-5 mb-4">
        <dl className="text-sm space-y-0">
          <div className="flex justify-between items-baseline py-2.5 border-b border-slate-100">
            <dt className="text-slate-500">Ward Unit</dt>
            <dd>
              <Link to={`/ward-units/${order.wardUnitId}`} className="text-accent hover:underline">
                {order.wardUnit?.name ?? order.wardUnitId}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between items-baseline py-2.5 border-b border-slate-100">
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-700">{formatDate(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between items-baseline py-2.5">
            <dt className="text-slate-500">Order ID</dt>
            <dd className="font-mono text-xs text-slate-400">{order.id}</dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-5 py-3 font-medium text-slate-600">Medication</th>
              <th className="px-5 py-3 font-medium text-slate-600 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: { medicationId: string; quantity: number; medication?: { innName: string } | null }) => (
              <tr key={line.medicationId} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 text-slate-800">{line.medication?.innName ?? line.medicationId}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-700">{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
