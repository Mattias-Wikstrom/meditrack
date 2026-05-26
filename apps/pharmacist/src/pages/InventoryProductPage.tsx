import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'urql';
import { BackButton, Card, Button, Spinner } from '@meditrack/ui';
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 shrink-0 mr-4">{label}</span>
      <span className="text-slate-800 text-right">{children}</span>
    </div>
  );
}

export function InventoryProductPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [restockQty, setRestockQty] = useState(1);
  const [restockError, setRestockError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restocked, setRestocked] = useState(false);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId! },
  });
  const [, restock] = useMutation(RESTOCK_MUTATION);

  async function handleRestock() {
    setSubmitting(true);
    setRestockError(null);
    setRestocked(false);
    const result = await restock({ medicinalProductId: productId!, quantity: restockQty });
    setSubmitting(false);
    if (result.error) { setRestockError(result.error.message); return; }
    if (!result.data?.restockProduct.successful) {
      setRestockError(result.data?.restockProduct.errors.join(', ') ?? 'Restock failed');
      return;
    }
    setRestocked(true);
    setRestockQty(1);
    refetch({ requestPolicy: 'network-only' });
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

  const newTotal = product.stockLevel + restockQty;

  return (
    <div>
      <BackButton onClick={() => navigate('/inventory')} className="mb-4" />
      <h1 className="text-xl font-semibold text-slate-800 mb-1">{product.productName}</h1>
      <p className="text-xs text-slate-400 font-mono mb-6">{product.id}</p>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Medication</h2>
          <InfoRow label="INN Name">{product.medication?.innName ?? '—'}</InfoRow>
          <InfoRow label="ATC Code">
            <span className="font-mono text-xs">{product.medication?.atcCode ?? '—'}</span>
          </InfoRow>
          <InfoRow label="Form">{product.medication?.form ?? '—'}</InfoRow>
          <InfoRow label="Strength">
            <span className="font-mono text-xs">{product.medication?.strength ?? '—'}</span>
          </InfoRow>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Stock</h2>
          <InfoRow label="Current level">
            <span className={`font-semibold tabular-nums ${product.isBelowThreshold ? 'text-red-600' : 'text-slate-800'}`}>
              {product.stockLevel}
              {product.isBelowThreshold && ' ⚠'}
            </span>
          </InfoRow>
          <InfoRow label="Minimum threshold">{product.stockThreshold}</InfoRow>
          <InfoRow label="Status">
            {product.isBelowThreshold
              ? <span className="text-red-600 font-medium">Below threshold</span>
              : <span className="text-green-600 font-medium">Adequate</span>
            }
          </InfoRow>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Restock</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Units to add</label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={e => {
                    setRestocked(false);
                    setRestockQty(Math.max(1, parseInt(e.target.value) || 1));
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
                <p className="text-xs text-slate-400 mt-1">New total: {newTotal}</p>
              </div>
              <div className="pt-5">
                <Button onClick={handleRestock} disabled={submitting}>
                  {submitting ? 'Saving…' : '+ Add stock'}
                </Button>
              </div>
            </div>
            {restockError && <p className="text-xs text-red-600 mt-2">{restockError}</p>}
            {restocked && <p className="text-xs text-green-600 mt-2">Stock updated successfully.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
