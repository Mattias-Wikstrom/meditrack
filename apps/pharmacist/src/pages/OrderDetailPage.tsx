import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { Badge, Button, Card, Spinner } from '@meditrack/ui';
import { ordersApi } from '../api/orders';
import type { ProductSelection } from '../api/orders';

const ORDER_QUERY = `
  query Order($id: ID!) {
    order(id: $id) {
      id wardUnitId status createdAt
      lines {
        medicationId quantity
        medication { id innName }
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query Products($medicationId: ID) {
    medicinalProducts(medicationId: $medicationId) {
      id productName stockLevel isBelowThreshold
    }
  }
`;

function LineDeliveryRow({
  line,
  selection,
  onChange,
}: {
  line: { medicationId: string; quantity: number; medication?: { id: string; innName: string } | null };
  selection: ProductSelection;
  onChange: (s: ProductSelection) => void;
}) {
  const [{ data }] = useQuery({
    query: PRODUCTS_QUERY,
    variables: { medicationId: line.medicationId },
  });

  const products: { id: string; productName: string; stockLevel: number; isBelowThreshold: boolean }[] =
    data?.medicinalProducts ?? [];

  return (
    <div className="px-5 py-4 border-b border-slate-100 last:border-0">
      <p className="text-sm font-medium text-slate-800 mb-3">
        {line.medication?.innName ?? line.medicationId}
        <span className="ml-2 text-slate-400 font-normal">× {line.quantity} ordered</span>
      </p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Product</label>
          <select
            value={selection.medicinalProductId}
            onChange={(e) => onChange({ ...selection, medicinalProductId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.productName} ({p.stockLevel} in stock{p.isBelowThreshold ? ' ⚠︎' : ''})
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs text-slate-500 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={line.quantity}
            value={selection.quantity}
            onChange={(e) => onChange({ ...selection, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [{ data, fetching, error }] = useQuery({ query: ORDER_QUERY, variables: { id } });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const order = data?.order;

  const [selections, setSelections] = useState<Record<string, ProductSelection>>({});

  function getSelection(medicationId: string, quantity: number): ProductSelection {
    return selections[medicationId] ?? { medicationId, medicinalProductId: '', quantity };
  }

  function updateSelection(medicationId: string, s: ProductSelection) {
    setSelections((prev) => ({ ...prev, [medicationId]: s }));
  }

  async function handleDeliver() {
    if (!order) return;
    const productSelections = order.lines.map((l: { medicationId: string; quantity: number }) =>
      getSelection(l.medicationId, l.quantity)
    );
    const missing = productSelections.filter((s) => !s.medicinalProductId);
    if (missing.length > 0) { setSubmitError('Select a product for every line.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await ordersApi.deliver(order.id, productSelections);
      navigate('/');
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 transition-colors text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-slate-800">Order <span className="font-mono">{shortId}…</span></h1>
        <Badge status={order.status} />
      </div>

      <Card className="mb-6 overflow-hidden">
        {order.lines.map((line: { medicationId: string; quantity: number; medication?: { id: string; innName: string } | null }) => (
          <LineDeliveryRow
            key={line.medicationId}
            line={line}
            selection={getSelection(line.medicationId, line.quantity)}
            onChange={(s) => updateSelection(line.medicationId, s)}
          />
        ))}
      </Card>

      {submitError && <p className="text-red-600 text-sm mb-4">{submitError}</p>}

      <Button onClick={handleDeliver} disabled={submitting} className="w-full">
        {submitting ? 'Delivering…' : 'Deliver Order'}
      </Button>
    </div>
  );
}
