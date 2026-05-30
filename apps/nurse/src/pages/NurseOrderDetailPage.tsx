import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useClient } from 'urql';
import { OrderStatusBadge, MedicationSearch, Button, Card, Spinner, formatDateTime } from '@meditrack/ui';
import type { MedicationOption } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const ORDER_QUERY = graphql(`
  query NurseOrder($id: ID!) {
    order(id: $id) {
      id wardUnitId wardUnit { name } status createdAt
      lines { medicationId quantity medication { innName strength } }
    }
  }
`);

const SEARCH_MEDS_QUERY = graphql(`
  query NurseOrderDetailMedications($query: String) {
    medications(query: $query) { id innName atcCode form strength }
  }
`);

interface Line {
  medicationId: string;
  innName: string;
  strength: string;
  quantity: number;
}

export function NurseOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const urqlClient = useClient();
  const ordersApi = useOrdersApi();

  const [{ data, fetching }, refetch] = useQuery({
    query: ORDER_QUERY,
    variables: { id: orderId! },
    requestPolicy: 'cache-and-network',
  });
  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  const [lines, setLines] = useState<Line[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = data?.order;
  const isDraft = order?.status === 'Draft';

  useEffect(() => {
    if (order && !initialized) {
      setLines(
        order.lines.map((l: { medicationId: string; quantity: number; medication?: { innName: string; strength: string } | null }) => ({
          medicationId: l.medicationId,
          innName: l.medication?.innName ?? l.medicationId,
          strength: l.medication?.strength ?? '',
          quantity: l.quantity,
        }))
      );
      setInitialized(true);
    }
  }, [order, initialized]);

  const fetcher = useCallback(async (query: string): Promise<MedicationOption[]> => {
    const result = await urqlClient.query(SEARCH_MEDS_QUERY, { query }).toPromise();
    return result.data?.medications ?? [];
  }, [urqlClient]);

  async function persist(nextLines: Line[]) {
    if (!orderId) return;
    setSaving(true);
    setError(null);
    try {
      await ordersApi.updateLines(orderId, nextLines.map(({ medicationId, quantity }) => ({ medicationId, quantity })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function addLine(med: MedicationOption) {
    if (lines.some(l => l.medicationId === med.id)) return;
    const next = [...lines, { medicationId: med.id, innName: med.innName, strength: med.strength, quantity: 1 }];
    setLines(next);
    void persist(next);
  }

  function updateQty(medicationId: string, qty: number) {
    const next = lines.map(l => l.medicationId === medicationId ? { ...l, quantity: Math.max(1, qty) } : l);
    setLines(next);
    void persist(next);
  }

  function removeLine(medicationId: string) {
    const next = lines.filter(l => l.medicationId !== medicationId);
    setLines(next);
    void persist(next);
  }

  async function handleSend() {
    if (!orderId) return;
    setSending(true);
    setError(null);
    try {
      await ordersApi.send(orderId);
      navigate('/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send order');
      setSending(false);
    }
  }

  if (fetching && !data) return <Spinner />;
  if (!order) return <p className="error-text" style={{ padding: 16 }}>Order not found.</p>;

  const busy = saving || sending;

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <button className="backlink" onClick={() => navigate('/orders')}>← Orders</button>

      <div>
        <div className="row" style={{ gap: 14, marginBottom: 6 }}>
          <h1 className="h1">Order</h1>
          <OrderStatusBadge status={order.status} />
          {saving && <span className="subtle">Saving…</span>}
        </div>
        <div className="subtle">{order.wardUnit?.name ?? order.wardUnitId} · {formatDateTime(order.createdAt)}</div>
      </div>

      {lines.length > 0 ? (
        <Card className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {lines.map(line => (
            <div key={line.medicationId} className="line">
              <div>
                <div className="lname">{line.innName}</div>
                <div className="lmeta">{line.strength}</div>
              </div>
              {isDraft ? (
                <div className="row">
                  <div className="stepper">
                    <button onClick={() => updateQty(line.medicationId, line.quantity - 1)}>–</button>
                    <span className="v">{line.quantity}</span>
                    <button onClick={() => updateQty(line.medicationId, line.quantity + 1)}>+</button>
                  </div>
                  <button className="iconbtn" onClick={() => removeLine(line.medicationId)} aria-label="Remove">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6l12 12"/><path d="M18 6L6 18"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <span className="fulfil">×{line.quantity}</span>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <div className="empty">No medications added yet.</div>
      )}

      {isDraft && (
        <div>
          <MedicationSearch label="Medication to add" onSelect={addLine} fetcher={fetcher} />
          {lines.length > 0 && <div className="hint">Add more medications by searching above.</div>}
        </div>
      )}

      {error && <p role="alert" className="error-text">{error}</p>}

      {isDraft && (
        <Button className="btn-block" onClick={handleSend} disabled={busy || lines.length === 0}>
          {sending ? 'Sending…' : 'Send Order'}
        </Button>
      )}

      <div className="subtle mono" style={{ fontSize: 12.5, marginTop: 24 }}>Order ID · {order.id}</div>
    </div>
  );
}
