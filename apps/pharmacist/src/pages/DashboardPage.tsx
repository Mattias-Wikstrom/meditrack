import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { OrderCard, Button, Spinner } from '@meditrack/ui';
import { ordersApi } from '../api/orders';

const ORDERS_QUERY = `
  query Orders {
    sent: orders(status: Sent) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
    confirmed: orders(status: Confirmed) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`;

const ORDER_STATUS_SUB = `
  subscription {
    orderStatusChanged { orderId from to }
  }
`;

export function DashboardPage() {
  const [{ data, fetching, error }, refetch] = useQuery({ query: ORDERS_QUERY });

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

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const sent = data?.sent ?? [];
  const confirmed = data?.confirmed ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Pending Confirmation
          {sent.length > 0 && <span className="ml-2 text-xs font-medium bg-accent-light text-accent px-2 py-0.5 rounded-full">{sent.length}</span>}
        </h2>
        {sent.length === 0
          ? <p className="text-slate-400 text-sm py-8 text-center">No orders awaiting confirmation.</p>
          : <div className="space-y-4">
              {sent.map((order: typeof sent[number]) => (
                <OrderCard key={order.id} order={order}>
                  <Button size="sm" className="w-full" onClick={() => handleConfirm(order.id)}>
                    Confirm →
                  </Button>
                </OrderCard>
              ))}
            </div>
        }
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Ready to Deliver
          {confirmed.length > 0 && <span className="ml-2 text-xs font-medium bg-accent-light text-accent px-2 py-0.5 rounded-full">{confirmed.length}</span>}
        </h2>
        {confirmed.length === 0
          ? <p className="text-slate-400 text-sm py-8 text-center">No orders ready for delivery.</p>
          : <div className="space-y-4">
              {confirmed.map((order: typeof confirmed[number]) => (
                <OrderCard key={order.id} order={order}>
                  <Link to={`/orders/${order.id}`}>
                    <Button size="sm" variant="ghost" className="w-full border border-slate-200">
                      Deliver →
                    </Button>
                  </Link>
                </OrderCard>
              ))}
            </div>
        }
      </section>
    </div>
  );
}
