// Used for /inventory/:productId (pharmacist)
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { InventoryProductDetail, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';

const PRODUCT_DETAIL_QUERY = graphql(`
  query PharmacistProductDetail($id: ID!) {
    medicinalProduct(id: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

export function InventoryProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { token } = useAuth();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId! },
  });
  useRefetchOn('MedicinalProduct', () => refetch({ requestPolicy: 'network-only' }));

  async function handleRestock(quantity: number): Promise<string | null> {
    try {
      await createApiClient(token!).post(`/products/${productId}/restock`, { quantity });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Restock failed';
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const product = data?.medicinalProduct;
  if (!product) return (
    <p className="text-sm text-[var(--muted)]">
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
