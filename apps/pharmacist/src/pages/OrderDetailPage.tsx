// Used for /orders/:id (pharmacist)
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { OrderStatusBadge, Button, Card, Spinner, PageHeader } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import type { ProductSelection } from '../api/orders';
import { graphql } from '../gql';
import type { GetOrderQuery } from '../gql/graphql';

// ── Confirm view (order is Sent, awaiting pharmacist confirmation) ─────────────

function ConfirmView({ order, onConfirmed }: {
  order: NonNullable<GetOrderQuery['order']>;
  onConfirmed: () => void;
}) {
  const ordersApi = useOrdersApi();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await ordersApi.confirm(order.id);
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="py-3 px-5 font-medium text-slate-600">Medication</th>
            <th className="py-3 px-5 font-medium text-slate-600 text-right">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map(line => (
            <tr key={line.medicationId} className="border-b border-slate-100 last:border-0">
              <td className="py-3 px-5 text-slate-800">{line.medication?.innName ?? line.medicationId}</td>
              <td className="py-3 px-5 text-right font-medium tabular-nums text-slate-700">{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="px-5 pb-4 text-xs text-red-600">{error}</p>}
      <div className="px-5 py-4 border-t border-slate-100">
        <Button onClick={handleConfirm} disabled={submitting} className="w-full">
          {submitting ? 'Confirming…' : 'Confirm Order'}
        </Button>
      </div>
    </Card>
  );
}

const ORDER_QUERY = graphql(`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id wardUnitId status createdAt
      lines {
        medicationId quantity
        medication { id innName }
      }
    }
  }
`);

const PRODUCTS_QUERY = graphql(`
  query GetProducts($medicationId: ID) {
    medicinalProducts(medicationId: $medicationId) {
      id productName stockLevel isBelowThreshold
    }
  }
`);

type OrderLine = NonNullable<NonNullable<GetOrderQuery['order']>['lines'][number]>;

// One row in the split list for a single order line.
interface Split {
  medicinalProductId: string;
  quantity: number;
}

function LineDeliverySection({
  line,
  splits,
  onChange,
}: {
  line: OrderLine;
  splits: Split[];
  onChange: (splits: Split[]) => void;
}) {
  const [{ data }] = useQuery({
    query: PRODUCTS_QUERY,
    variables: { medicationId: line.medicationId },
  });

  const products = data?.medicinalProducts ?? [];
  const selectedSplits = splits.filter(s => s.medicinalProductId !== '');
  const totalAllocated = selectedSplits.reduce((sum, s) => sum + s.quantity, 0);
  const remaining = line.quantity - totalAllocated;
  const overAllocated = totalAllocated > line.quantity;
  const covered = totalAllocated === line.quantity && selectedSplits.length === splits.length;
  const selectedIds = selectedSplits.map(s => s.medicinalProductId);
  const hasDuplicates = new Set(selectedIds).size < selectedIds.length;

  function updateSplit(index: number, patch: Partial<Split>) {
    onChange(splits.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSplit() {
    onChange([...splits, { medicinalProductId: '', quantity: Math.max(1, remaining) }]);
  }

  function removeSplit(index: number) {
    onChange(splits.filter((_, i) => i !== index));
  }

  const multiRow = splits.length > 1;

  return (
    <div className="px-5 py-4 border-b border-slate-100 last:border-0">
      {/* Line header */}
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-medium text-slate-800">
          {line.medication?.innName ?? line.medicationId}
          <span className="ml-2 text-slate-400 font-normal">× {line.quantity} ordered</span>
        </p>
        <span className={`text-xs font-medium tabular-nums ${covered ? 'text-green-600' : overAllocated ? 'text-red-600' : 'text-slate-400'}`}>
          {totalAllocated} / {line.quantity}{covered ? ' ✓' : overAllocated ? ' ✕' : ''}
        </span>
      </div>

      {/* Column headers — stable width, always rendered */}
      <div className="flex gap-2 mb-1.5">
        <p className="flex-1 text-xs text-slate-500">Product</p>
        <p className="w-20 text-xs text-slate-500">Qty</p>
        <div className="w-6" /> {/* spacer keeps headers aligned with rows */}
      </div>

      {/* Split rows */}
      <div className="space-y-2">
        {splits.map((split, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={split.medicinalProductId}
              onChange={(e) => updateSplit(i, { medicinalProductId: e.target.value })}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.stockLevel} in stock{p.isBelowThreshold ? ' ⚠︎' : ''})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={line.quantity}
              value={split.quantity}
              onChange={(e) => updateSplit(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            {multiRow ? (
              <button
                onClick={() => removeSplit(i)}
                className="w-6 text-slate-300 hover:text-red-400 transition-colors text-sm"
                title="Remove"
              >
                ✕
              </button>
            ) : (
              <div className="w-6" />
            )}
          </div>
        ))}
      </div>

      {hasDuplicates && (
        <p className="mt-2 text-xs text-red-600">Each product can only be selected once per order line.</p>
      )}

      {/* Split button — only when there is remaining quantity to allocate */}
      {remaining > 0 && !overAllocated && (
        <button
          onClick={addSplit}
          className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          + Split across products
        </button>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ordersApi = useOrdersApi();
  const [{ data, fetching, error }] = useQuery({ query: ORDER_QUERY, variables: { id: id! }, requestPolicy: 'network-only' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const order = data?.order;

  // One entry per order line; each entry is an array of splits.
  const [allSplits, setAllSplits] = useState<Record<string, Split[]>>({});

  function getSplits(medicationId: string, orderedQty: number): Split[] {
    return allSplits[medicationId] ?? [{ medicinalProductId: '', quantity: orderedQty }];
  }

  function updateSplits(medicationId: string, splits: Split[]) {
    setAllSplits((prev) => ({ ...prev, [medicationId]: splits }));
  }

  function lineIsValid(medicationId: string, orderedQty: number): boolean {
    const splits = getSplits(medicationId, orderedQty);
    if (splits.some(s => !s.medicinalProductId)) return false;
    const total = splits.reduce((sum, s) => sum + s.quantity, 0);
    if (total !== orderedQty) return false;
    const ids = splits.map(s => s.medicinalProductId);
    return new Set(ids).size === ids.length;
  }

  const canDeliver = !!order && order.lines.every(l => lineIsValid(l.medicationId, l.quantity));

  async function handleDeliver() {
    if (!order || !canDeliver) return;

    // Validate: every split must have a product selected, totals must match, no duplicates.
    for (const line of order.lines) {
      const splits = getSplits(line.medicationId, line.quantity);
      if (splits.some((s) => !s.medicinalProductId)) {
        setSubmitError('Select a product for every row.');
        return;
      }
      const total = splits.reduce((sum, s) => sum + s.quantity, 0);
      if (total !== line.quantity) {
        setSubmitError(`Quantities for ${line.medication?.innName ?? line.medicationId} must add up to ${line.quantity}.`);
        return;
      }
      const ids = splits.map(s => s.medicinalProductId);
      if (new Set(ids).size !== ids.length) {
        setSubmitError(`Each product can only be selected once per order line.`);
        return;
      }
    }

    const productSelections: ProductSelection[] = order.lines.flatMap((line) =>
      getSplits(line.medicationId, line.quantity).map((s) => ({
        medicationId: line.medicationId,
        medicinalProductId: s.medicinalProductId,
        quantity: s.quantity,
      }))
    );

    setSubmitting(true);
    setSubmitError(null);
    try {
      await ordersApi.deliver(order.id, productSelections);
      navigate('/orders');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Delivery failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error || !order) return <p className="text-red-600 text-sm">Order not found.</p>;

  const shortId = order.id.slice(0, 8);

  return (
    <div className="max-w-xl">
      <PageHeader onBack={() => navigate('/orders')} className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Order <span className="font-mono">{shortId}…</span></h1>
        <OrderStatusBadge status={order.status} />
      </PageHeader>

      {order.status === 'Sent' ? (
        <ConfirmView order={order} onConfirmed={() => navigate('/orders')} />
      ) : order.status === 'Delivered' ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="py-3 px-5 font-medium text-slate-600">Medication</th>
                <th className="py-3 px-5 font-medium text-slate-600 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map(line => (
                <tr key={line.medicationId} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-5 text-slate-800">{line.medication?.innName ?? line.medicationId}</td>
                  <td className="py-3 px-5 text-right font-medium tabular-nums text-slate-700">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <>
          <Card className="mb-6 overflow-hidden">
            {order.lines.map((line) => (
              <LineDeliverySection
                key={line.medicationId}
                line={line}
                splits={getSplits(line.medicationId, line.quantity)}
                onChange={(splits) => updateSplits(line.medicationId, splits)}
              />
            ))}
          </Card>

          {submitError && <p className="text-red-600 text-sm mb-4">{submitError}</p>}

          <Button onClick={handleDeliver} disabled={submitting || !canDeliver} className="w-full">
            {submitting ? 'Delivering…' : 'Deliver Order'}
          </Button>
        </>
      )}
    </div>
  );
}
