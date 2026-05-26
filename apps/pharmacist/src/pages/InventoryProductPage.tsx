import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'urql';
import { InventoryProductDetail, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const PRODUCT_DETAIL_QUERY = graphql(`
  query PharmacistProductDetail($id: ID!) {
    medicinalProduct(id: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

const RESTOCK_MUTATION = graphql(`
  mutation RestockProductDetail($medicinalProductId: ID!, $quantity: Int!) {
    restockProduct(medicinalProductId: $medicinalProductId, quantity: $quantity) {
      successful
      product { id stockLevel isBelowThreshold }
      errors
    }
  }
`);

export function InventoryProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId! },
  });
  const [, restock] = useMutation(RESTOCK_MUTATION);

  async function handleRestock(quantity: number): Promise<string | null> {
    const result = await restock({ medicinalProductId: productId!, quantity });
    if (result.error) return result.error.message;
    if (!result.data?.restockProduct.successful) {
      return result.data?.restockProduct.errors.join(', ') ?? 'Restock failed';
    }
    refetch({ requestPolicy: 'network-only' });
    return null;
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const product = data?.medicinalProduct;
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
