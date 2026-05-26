// Used for /orders (pharmacist)
import { useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { Card, OrderStatusBadge, Button, Spinner, LineList, formatDate } from '@meditrack/ui';
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
    delivered: orders(status: Delivered) {
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

function CountOrderStatusBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="ml-2 text-xs font-medium bg-accent-light text-accent px-2 py-0.5 rounded-full">
      {n}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
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
  const delivered = [...(data?.delivered ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Pending Confirmation <CountOrderStatusBadge n={sent.length} />
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
                <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap align-top">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs align-top">{order.wardUnitId}</td>
                  <td className="py-3 px-4 align-top"><LineList lines={order.lines} /></td>
                  <td className="py-3 px-4 align-top"><OrderStatusBadge status={order.status} /></td>
                  <td className="py-3 px-4 text-right align-top">
                    <Button size="sm" onClick={e => { e.stopPropagation(); handleConfirm(order.id); }}>Confirm →</Button>
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
          Ready to Deliver <CountOrderStatusBadge n={confirmed.length} />
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
                <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap align-top">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs align-top">{order.wardUnitId}</td>
                  <td className="py-3 px-4 align-top"><LineList lines={order.lines} /></td>
                  <td className="py-3 px-4 align-top"><OrderStatusBadge status={order.status} /></td>
                  <td className="py-3 px-4 text-right align-top">
                    <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>Deliver →</Button>
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

      {delivered.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm text-slate-400 hover:text-slate-600 transition-colors list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            Delivered ({delivered.length})
          </summary>
          <div className="mt-3 opacity-60">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">Created</th>
                    <th className="py-3 px-4 font-medium text-slate-600">Ward Unit</th>
                    <th className="py-3 px-4 font-medium text-slate-600">Medications</th>
                    <th className="py-3 px-4 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {delivered.map(order => (
                    <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap align-top">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs align-top">{order.wardUnitId}</td>
                      <td className="py-3 px-4 align-top"><LineList lines={order.lines} /></td>
                      <td className="py-3 px-4 align-top"><OrderStatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </details>
      )}
    </div>
  );
}
