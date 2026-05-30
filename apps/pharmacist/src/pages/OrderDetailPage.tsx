import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { useRefetchOn } from '@meditrack/client';
import { OrderStatusBadge, Button, Card, Spinner } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import type { ProductSelection } from '../api/orders';
import { graphql } from '../gql';
import type { GetOrderQuery } from '../gql/graphql';

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
    <Card>
      <table className="tbl">
        <thead>
          <tr>
            <th className="no-sort">Medication</th>
            <th className="no-sort num">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map(line => (
            <tr key={line.medicationId}>
              <td>{line.medication?.innName ?? line.medicationId}</td>
              <td className="num">{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p role="alert" className="error-text" style={{ padding: '0 18px 12px' }}>{error}</p>}
      <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border)' }}>
        <Button className="btn-block" onClick={handleConfirm} disabled={submitting}>
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

interface Split {
  medicinalProductId: string;
  quantity: number;
}

function LineDeliverySection({
  line, splits, onChange, refreshKey,
}: {
  line: OrderLine;
  splits: Split[];
  onChange: (splits: Split[]) => void;
  refreshKey: number;
}) {
  const [{ data }, reexecute] = useQuery({
    query: PRODUCTS_QUERY,
    variables: { medicationId: line.medicationId },
  });

  useEffect(() => {
    if (refreshKey > 0) reexecute({ requestPolicy: 'network-only' });
  }, [refreshKey, reexecute]);

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
    <div className="line" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
      <div className="row">
        <div style={{ flex: 1 }}>
          <span className="lname">{line.medication?.innName ?? line.medicationId}</span>
          <span className="subtle" style={{ marginLeft: 8 }}>×{line.quantity} ordered</span>
        </div>
        <span className={`fulfil${covered ? ' done' : overAllocated ? '' : ' partial'}`}
          style={{ color: overAllocated ? 'var(--danger)' : undefined }}>
          {totalAllocated} / {line.quantity}{covered ? ' ✓' : overAllocated ? ' ✕' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {splits.map((split, i) => (
          <div key={i} className="row" style={{ gap: 8 }}>
            <select
              value={split.medicinalProductId}
              onChange={(e) => updateSplit(i, { medicinalProductId: e.target.value })}
              className="select"
              style={{ flex: 1 }}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.stockLevel} in stock{p.isBelowThreshold ? ' ⚠' : ''})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={line.quantity}
              value={split.quantity}
              onChange={(e) => updateSplit(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="input"
              style={{ width: 80 }}
            />
            {multiRow ? (
              <button className="iconbtn" onClick={() => removeSplit(i)} aria-label="Remove">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12"/><path d="M18 6L6 18"/>
                </svg>
              </button>
            ) : <div style={{ width: 34 }} />}
          </div>
        ))}
      </div>

      {hasDuplicates && <p className="error-text">Each product can only be selected once per order line.</p>}
      {remaining > 0 && !overAllocated && (
        <button className="linkbtn" onClick={addSplit}>+ Split across products</button>
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
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  useRefetchOn('MedicinalProduct', () => setProductRefreshKey(k => k + 1));

  const order = data?.order;
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
    return new Set(splits.map(s => s.medicinalProductId)).size === splits.length;
  }

  const canDeliver = !!order && order.lines.every(l => lineIsValid(l.medicationId, l.quantity));

  async function handleDeliver() {
    if (!order || !canDeliver) return;
    for (const line of order.lines) {
      const splits = getSplits(line.medicationId, line.quantity);
      if (splits.some(s => !s.medicinalProductId)) { setSubmitError('Select a product for every row.'); return; }
      const total = splits.reduce((sum, s) => sum + s.quantity, 0);
      if (total !== line.quantity) { setSubmitError(`Quantities for ${line.medication?.innName ?? line.medicationId} must add up to ${line.quantity}.`); return; }
      if (new Set(splits.map(s => s.medicinalProductId)).size !== splits.length) { setSubmitError('Each product can only be selected once per order line.'); return; }
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
      setProductRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) return <Spinner />;
  if (error || !order) return <p className="error-text">Order not found.</p>;

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <button className="backlink" onClick={() => navigate('/orders')}>← Orders</button>

      <div className="row" style={{ gap: 14 }}>
        <h1 className="h1">Order</h1>
        <OrderStatusBadge status={order.status} />
        <span className="subtle mono" style={{ fontSize: 12.5 }}>{order.id.slice(0, 8)}…</span>
      </div>

      {order.status === 'Sent' ? (
        <ConfirmView order={order} onConfirmed={() => navigate('/orders')} />
      ) : order.status === 'Delivered' ? (
        <Card>
          <table className="tbl">
            <thead><tr><th className="no-sort">Medication</th><th className="no-sort num">Quantity</th></tr></thead>
            <tbody>
              {order.lines.map(line => (
                <tr key={line.medicationId}>
                  <td>{line.medication?.innName ?? line.medicationId}</td>
                  <td className="num">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <>
          <Card className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {order.lines.map((line) => (
              <LineDeliverySection
                key={line.medicationId}
                line={line}
                splits={getSplits(line.medicationId, line.quantity)}
                onChange={(splits) => updateSplits(line.medicationId, splits)}
                refreshKey={productRefreshKey}
              />
            ))}
          </Card>
          {submitError && <p role="alert" className="error-text">{submitError}</p>}
          <Button className="btn-block" onClick={handleDeliver} disabled={submitting || !canDeliver}>
            {submitting ? 'Delivering…' : 'Deliver Order'}
          </Button>
        </>
      )}
    </div>
  );
}
