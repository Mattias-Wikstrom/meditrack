// Used for / (admin)
import { useQuery } from 'urql';
import { OrderAndStockOverview, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const OVERVIEW_QUERY = graphql(`
  query AdminOverview {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { innName atcCode strength }
    }
    orders { id status }
  }
`);

export function OverviewPage() {
  const [{ data, fetching, error }] = useQuery({ query: OVERVIEW_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const products = data?.medicinalProducts ?? [];

  return (
    <OrderAndStockOverview
      products={products}
      orders={data?.orders ?? []}
      getProductHref={id => `/inventory/${id}`}
      inventoryHref="/inventory"
      lowStockHref="/inventory?sort=stock&dir=asc"
      ordersHref="/orders"
    />
  );
}
