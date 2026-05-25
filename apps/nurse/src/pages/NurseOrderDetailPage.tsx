import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useClient } from 'urql';
import { MedicationSearch, Button, Card, Spinner, BackButton } from '@meditrack/ui';
import type { MedicationOption } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { graphql } from '../gql';

const ORDER_QUERY = graphql(`
  query NurseOrder($id: ID!) {
    order(id: $id) {
      id wardUnitId status createdAt
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

const STATUS_STYLES: Record<string, string> = {
  Draft:     'bg-slate-100 text-slate-600',
  Sent:      'bg-blue-100 text-blue-700',
  Confirmed: 'bg-amber-100 text-amber-700',
  Delivered: 'bg-green-100 text-green-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function NurseOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const urqlClient = useClient();
  const ordersApi = useOrdersApi();

  const [{ data, fetching }] = useQuery({
    query: ORDER_QUERY,
    variables: { id: orderId! },
    requestPolicy: 'cache-and-network',
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = data?.order;
  const isDraft = order?.status === 'Draft';

  // Populate lines once the order arrives from the server
  useEffect(() => {
    if (order && !initialized) {
      setLines(
        order.lines.map(l => ({
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
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send order');
      setSending(false);
    }
  }

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (!order) return <p className="text-red-600 text-sm p-4">Order not found.</p>;

  const busy = saving || sending;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-2">
        <BackButton onClick={() => navigate('/')} />
        <h1 className="text-xl font-semibold text-slate-800">Order</h1>
        <StatusBadge status={order.status} />
        {saving && <span className="ml-auto text-xs text-slate-400">Saving…</span>}
      </div>

      <p className="text-xs text-slate-400 mb-6">{order.wardUnitId} · {formatDate(order.createdAt)}</p>

      {lines.length > 0 ? (
        <Card className="mb-6 divide-y divide-slate-100">
          {lines.map(line => (
            <div key={line.medicationId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{line.innName}</p>
                <p className="text-xs text-slate-400">{line.strength}</p>
              </div>
              {isDraft ? (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(line.medicationId, line.quantity - 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-sm">−</button>
                    <span className="w-8 text-center text-sm font-medium text-slate-700">{line.quantity}</span>
                    <button onClick={() => updateQty(line.medicationId, line.quantity + 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-sm">+</button>
                  </div>
                  <button onClick={() => removeLine(line.medicationId)} className="text-slate-300 hover:text-red-400 transition-colors ml-1 text-lg leading-none">×</button>
                </>
              ) : (
                <span className="text-sm text-slate-600 shrink-0">× {line.quantity}</span>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <p className="text-slate-400 text-sm mb-6 text-center py-8">No medications added yet.</p>
      )}

      {isDraft && (
        <div className="mb-10">
          <label className="block text-sm font-medium text-slate-700 mb-2">Medication to add</label>
          <MedicationSearch onSelect={addLine} fetcher={fetcher} />
          {lines.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">Add additional medications by typing their names above.</p>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {isDraft && (
        <Button onClick={handleSend} disabled={busy || lines.length === 0} className="w-full">
          {sending ? 'Sending…' : 'Send Order'}
        </Button>
      )}

      <p className="mt-10 text-xs text-slate-300">
        Order id: <span className="font-mono">{order.id}</span>
      </p>
    </div>
  );
}
