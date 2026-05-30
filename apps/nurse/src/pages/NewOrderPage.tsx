import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from 'urql';
import { MedicationSearch, Button, Card } from '@meditrack/ui';
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
  const draftIdRef = useRef<string | null>(null);

  const fetcher = useCallback(async (query: string): Promise<MedicationOption[]> => {
    const result = await urql.query(MEDICATIONS_QUERY, { query }).toPromise();
    return result.data?.medications ?? [];
  }, [urql]);

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
    if (lines.some(l => l.medicationId === med.id)) return;
    const next = [...lines, { medicationId: med.id, innName: med.innName, strength: med.strength, quantity: 1 }];
    setLines(next);
    void persist(next);
  }

  function updateQty(medicationId: string, qty: number) {
    const next = lines.map(l => l.medicationId === medicationId ? { ...l, quantity: Math.max(1, qty) } : l);
    setLines(next);
    if (draftIdRef.current !== null) void persist(next);
  }

  function removeLine(medicationId: string) {
    const next = lines.filter(l => l.medicationId !== medicationId);
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
    <div className="stack" style={{ maxWidth: 760 }}>
      <button className="backlink" onClick={() => navigate('/orders')}>← Orders</button>
      <div>
        <h1 className="h1" style={{ marginBottom: 4 }}>New Order</h1>
        {saving && <span className="subtle">Saving…</span>}
      </div>

      {lines.length > 0 && (
        <Card className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {lines.map(line => (
            <div key={line.medicationId} className="line">
              <div>
                <div className="lname">{line.innName}</div>
                <div className="lmeta">{line.strength}</div>
              </div>
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
            </div>
          ))}
        </Card>
      )}

      <div>
        <MedicationSearch label="Medication to add" onSelect={addLine} fetcher={fetcher} />
        <div className="hint">
          {lines.length === 0
            ? 'Search by generic (INN) name to add the first medication.'
            : 'Add more medications by searching above.'}
        </div>
      </div>

      {error && <p role="alert" className="error-text">{error}</p>}

      <Button
        className="btn-block"
        onClick={handleSend}
        disabled={busy || lines.length === 0}
      >
        {sending ? 'Sending…' : `Send Order${lines.length > 0 ? ` · ${lines.length} item${lines.length > 1 ? 's' : ''}` : ''}`}
      </Button>
    </div>
  );
}
