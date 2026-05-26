import { useQuery } from 'urql';
import { OrderAndStockOverview, Spinner } from '@meditrack/ui';

const OVERVIEW_QUERY = `
  query AdminOverview {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { innName atcCode strength }
    }
    orders { id status }
  }
`;

export function OverviewPage() {
  const [{ data, fetching, error }] = useQuery({ query: OVERVIEW_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  return (
    <OrderAndStockOverview
      products={data?.medicinalProducts ?? []}
      orders={data?.orders ?? []}
      getProductHref={id => `/inventory/${id}`}
      inventoryHref="/inventory"
      lowStockHref="/inventory?sort=stock&dir=asc"
      ordersHref="/orders"
    />
  );
}
