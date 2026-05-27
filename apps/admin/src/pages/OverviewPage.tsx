// Used for / (admin)
import { useState, useEffect } from 'react';
import { useQuery, useSubscription } from 'urql';
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

const PRODUCT_UPDATED_SUB = graphql(`
  subscription AdminOverviewProductUpdated {
    medicinalProductUpdated {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`);

export function OverviewPage() {
  const [{ data, fetching, error }] = useQuery({ query: OVERVIEW_QUERY });

  const [{ data: subData }] = useSubscription({ query: PRODUCT_UPDATED_SUB });
  const productUpdate = subData?.medicinalProductUpdated;
  const [overrides, setOverrides] = useState<Map<string, NonNullable<typeof productUpdate>>>(new Map());

  useEffect(() => {
    if (!productUpdate) return;
    setOverrides(prev => new Map(prev).set(productUpdate.id, productUpdate));
  }, [productUpdate]);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const products = (data?.medicinalProducts ?? []).map(p => overrides.get(p.id) ?? p);

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
