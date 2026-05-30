// Used for /orders/new (nurse)
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from 'urql';
import { MedicationSearch, Button, Card, PageHeader } from '@meditrack/ui';
import type { MedicationOption } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { graphql } from '../gql';

const MEDICATIONS_QUERY = graphql(`
  query SearchMedications($query: String) {
    medications(query: $query) { id innName atcCode form strength }
  }
`);

interface Line {
  medicationId: string;
  innName: string;
  strength: string;
  quantity: number;
}

export function NewOrderPage() {
  const navigate = useNavigate();
  const urql = useClient();
  const ordersApi = useOrdersApi();
  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable ref so async callbacks always see the current draft id
  const draftIdRef = useRef<string | null>(null);

  const fetcher = useCallback(async (query: string): Promise<MedicationOption[]> => {
    const result = await urql.query(MEDICATIONS_QUERY, { query }).toPromise();
    return result.data?.medications ?? [];
  }, [urql]);

  /**
   * Persist the current lines to the server.
   * First call creates the draft; subsequent calls update its lines.
   */
  async function persist(nextLines: Line[]) {
    setSaving(true);
    setError(null);
    try {
      const apiLines = nextLines.map(({ medicationId, quantity }) => ({ medicationId, quantity }));
      if (draftIdRef.current === null) {
        const { id } = await ordersApi.create(apiLines);
        draftIdRef.current = id;
      } else {
        await ordersApi.updateLines(draftIdRef.current, apiLines);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  function addLine(med: MedicationOption) {
    if (lines.some((l) => l.medicationId === med.id)) return;
    const next = [...lines, { medicationId: med.id, innName: med.innName, strength: med.strength, quantity: 1 }];
    setLines(next);
    void persist(next);
  }

  function updateQty(medicationId: string, qty: number) {
    const next = lines.map((l) => l.medicationId === medicationId ? { ...l, quantity: Math.max(1, qty) } : l);
    setLines(next);
    if (draftIdRef.current !== null) void persist(next);
  }

  function removeLine(medicationId: string) {
    const next = lines.filter((l) => l.medicationId !== medicationId);
    setLines(next);
    if (draftIdRef.current !== null) void persist(next);
  }

  async function handleSend() {
    if (!draftIdRef.current || lines.length === 0) return;
    setSending(true);
    setError(null);
    try {
      await ordersApi.send(draftIdRef.current);
      navigate('/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send order');
      setSending(false);
    }
  }

  const busy = saving || sending;

  return (
    <div className="max-w-xl">
      <PageHeader
        onBack={() => navigate('/orders')}
        className="mb-6"
        actions={saving ? <span className="text-xs text-[var(--faint)]">Saving…</span> : undefined}
      >
        <h1 className="text-xl font-semibold text-[var(--ink)]">New Order</h1>
      </PageHeader>

      {lines.length > 0 && (
        <Card className="mb-6 divide-y divide-[var(--border)]">
          {lines.map((line) => (
            <div key={line.medicationId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{line.innName}</p>
                <p className="text-xs text-[var(--faint)]">{line.strength}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(line.medicationId, line.quantity - 1)} className="w-7 h-7 rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] flex items-center justify-center text-sm">−</button>
                <span className="w-8 text-center text-sm font-medium text-[var(--text)]">{line.quantity}</span>
                <button onClick={() => updateQty(line.medicationId, line.quantity + 1)} className="w-7 h-7 rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] flex items-center justify-center text-sm">+</button>
              </div>
              <button onClick={() => removeLine(line.medicationId)} className="text-[var(--faint)] hover:text-[var(--danger)] transition-colors ml-1 text-lg leading-none">×</button>
            </div>
          ))}
        </Card>
      )}

      <div className="mb-10">
        <MedicationSearch label="Medication to add" onSelect={addLine} fetcher={fetcher} />
        {lines.length > 0 && (
          <p className="mt-2 text-xs text-[var(--faint)]">Add additional medications by typing their names above.</p>
        )}
      </div>

      {error && <p role="alert" className="text-[var(--danger)] text-sm mb-4">{error}</p>}

      <Button onClick={handleSend} disabled={busy || lines.length === 0} className="w-full">
        {sending ? 'Sending…' : 'Send Order'}
      </Button>
    </div>
  );
}
