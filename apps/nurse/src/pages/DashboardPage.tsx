import { Link } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { OrderCard, Button, Spinner } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { graphql } from '../gql';

const ORDERS_QUERY = graphql(`
  query NurseOrders {
    orders {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`);

const ORDER_STATUS_SUB = graphql(`
  subscription NurseOrderStatusChanged {
    orderStatusChanged { orderId from to }
  }
`);

export function DashboardPage() {
  const ordersApi = useOrdersApi();
  const [{ data, fetching, error }, refetch] = useQuery({ query: ORDERS_QUERY, requestPolicy: 'cache-and-network' });

  useSubscription({ query: ORDER_STATUS_SUB }, () => {
    refetch({ requestPolicy: 'network-only' });
    return undefined;
  });

  async function handleSend(orderId: string) {
    try {
      await ordersApi.send(orderId);
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send order');
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const orders = data?.orders ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Orders</h1>
        <Link to="/orders/new">
          <Button>+ New Order</Button>
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-16">No orders yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order}>
              {order.status === 'Draft' && (
                <Button size="sm" className="w-full" onClick={() => handleSend(order.id)}>
                  Send to pharmacy →
                </Button>
              )}
            </OrderCard>
          ))}
        </div>
      )}
    </div>
  );
}
