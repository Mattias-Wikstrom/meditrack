// Used for /inventory/:productId (pharmacist)
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { InventoryProductDetail, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';
import { useAuth, createApiClient } from '@meditrack/client';

const PRODUCT_DETAIL_QUERY = graphql(`
  query PharmacistProductDetail($id: ID!) {
    medicinalProduct(id: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

const PRODUCT_UPDATED_SUB = graphql(`
  subscription PharmacistProductDetailUpdated {
    medicinalProductUpdated {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

export function InventoryProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { token } = useAuth();

  const [{ data, fetching, error }] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId! },
  });

  const [{ data: productUpdateData }] = useSubscription({ query: PRODUCT_UPDATED_SUB });
  const liveProduct = productUpdateData?.medicinalProductUpdated?.id === productId
    ? productUpdateData.medicinalProductUpdated
    : undefined;

  async function handleRestock(quantity: number): Promise<string | null> {
    try {
      await createApiClient(token!).post(`/products/${productId}/restock`, { quantity });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Restock failed';
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const product = liveProduct ?? data?.medicinalProduct;
  if (!product) return (
    <p className="text-sm text-slate-500">
      Product not found.{' '}
      <a className="text-accent hover:underline" href="/inventory">Back to inventory</a>.
    </p>
  );

  return (
    <InventoryProductDetail
      product={product}
      onBack={() => navigate('/inventory')}
      onRestock={handleRestock}
      getMedicationHref={id => `/medications/${id}`}
    />
  );
}
