import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from 'urql';
import { MedicationSearch, Button, Card } from '@meditrack/ui';
import type { MedicationOption } from '@meditrack/ui';
import { ordersApi } from '../api/orders';
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

const WARD_UNIT_ID = 'ward-1';

export function NewOrderPage() {
  const navigate = useNavigate();
  const urql = useClient();
  const [lines, setLines] = useState<Line[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async (query: string): Promise<MedicationOption[]> => {
    const result = await urql.query(MEDICATIONS_QUERY, { query }).toPromise();
    return result.data?.medications ?? [];
  }, [urql]);

  function addLine(med: MedicationOption) {
    if (lines.some((l) => l.medicationId === med.id)) return;
    setLines((prev) => [...prev, { medicationId: med.id, innName: med.innName, strength: med.strength, quantity: 1 }]);
  }

  function updateQty(medicationId: string, qty: number) {
    setLines((prev) => prev.map((l) => l.medicationId === medicationId ? { ...l, quantity: Math.max(1, qty) } : l));
  }

  function removeLine(medicationId: string) {
    setLines((prev) => prev.filter((l) => l.medicationId !== medicationId));
  }

  async function handleSubmit() {
    if (lines.length === 0) { setError('Add at least one medication.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await ordersApi.create(WARD_UNIT_ID, lines.map(({ medicationId, quantity }) => ({ medicationId, quantity })));
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 transition-colors text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-slate-800">New Order</h1>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Search medications</label>
        <MedicationSearch onSelect={addLine} fetcher={fetcher} />
      </div>

      {lines.length > 0 && (
        <Card className="mb-6 divide-y divide-slate-100">
          {lines.map((line) => (
            <div key={line.medicationId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{line.innName}</p>
                <p className="text-xs text-slate-400">{line.strength}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(line.medicationId, line.quantity - 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-sm">−</button>
                <span className="w-8 text-center text-sm font-medium text-slate-700">{line.quantity}</span>
                <button onClick={() => updateQty(line.medicationId, line.quantity + 1)} className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center text-sm">+</button>
              </div>
              <button onClick={() => removeLine(line.medicationId)} className="text-slate-300 hover:text-red-400 transition-colors ml-1 text-lg leading-none">×</button>
            </div>
          ))}
        </Card>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <Button onClick={handleSubmit} disabled={submitting || lines.length === 0} className="w-full">
        {submitting ? 'Creating…' : 'Create Order'}
      </Button>
    </div>
  );
}
