import { Link } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { Card, Badge, Button, Spinner } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { graphql } from '../gql';

const ORDERS_QUERY = graphql(`
  query PharmacistOrders {
    sent: orders(status: Sent) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
    confirmed: orders(status: Confirmed) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`);

const ORDER_STATUS_SUB = graphql(`
  subscription PharmacistOrderStatusChanged {
    orderStatusChanged { orderId from to }
  }
`);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

type OrderLine = { medicationId: string; quantity: number; medication?: { innName: string } | null };

const LINE_LIMIT = 3;

function LineList({ lines }: { lines: OrderLine[] }) {
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

function CountBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="ml-2 text-xs font-medium bg-accent-light text-accent px-2 py-0.5 rounded-full">
      {n}
    </span>
  );
}

export function DashboardPage() {
  const ordersApi = useOrdersApi();
  const [{ data, fetching, error }, refetch] = useQuery({ query: ORDERS_QUERY, requestPolicy: 'cache-and-network' });

  useSubscription({ query: ORDER_STATUS_SUB }, () => {
    refetch({ requestPolicy: 'network-only' });
    return undefined;
  });

  async function handleConfirm(orderId: string) {
    try {
      await ordersApi.confirm(orderId);
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to confirm order');
    }
  }

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const sent = data?.sent ?? [];
  const confirmed = data?.confirmed ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Pending Confirmation <CountBadge n={sent.length} />
        </h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">Created</th>
                <th className="py-3 px-4 font-medium text-slate-600">Ward Unit</th>
                <th className="py-3 px-4 font-medium text-slate-600">Medications</th>
                <th className="py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sent.map(order => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{order.wardUnitId}</td>
                  <td className="py-3 px-4"><LineList lines={order.lines} /></td>
                  <td className="py-3 px-4"><Badge status={order.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" onClick={() => handleConfirm(order.id)}>Confirm →</Button>
                  </td>
                </tr>
              ))}
              {sent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No orders awaiting confirmation.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Ready to Deliver <CountBadge n={confirmed.length} />
        </h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">Created</th>
                <th className="py-3 px-4 font-medium text-slate-600">Ward Unit</th>
                <th className="py-3 px-4 font-medium text-slate-600">Medications</th>
                <th className="py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {confirmed.map(order => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{order.wardUnitId}</td>
                  <td className="py-3 px-4"><LineList lines={order.lines} /></td>
                  <td className="py-3 px-4"><Badge status={order.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/orders/${order.id}`}>
                      <Button size="sm" variant="ghost">Deliver →</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {confirmed.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No orders ready for delivery.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
