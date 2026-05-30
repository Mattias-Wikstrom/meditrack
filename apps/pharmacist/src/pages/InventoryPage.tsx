// Used for /inventory (pharmacist)
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Button, Spinner, SortIcon, sortProducts } from '@meditrack/ui';
import { graphql } from '../gql';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';

const INVENTORY_QUERY = graphql(`
  query PharmacistInventory {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);


interface RestockDialogProps {
  productName: string;
  currentStock: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

function RestockDialog({ productName, currentStock, onConfirm, onCancel, submitting, error }: RestockDialogProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border)] p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-[var(--ink)] mb-1">Restock</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          {productName} · currently <span className="font-medium text-[var(--text)]">{currentStock}</span> in stock
        </p>

        <label className="block text-xs font-medium text-[var(--text)] mb-1">Units to add</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent mb-1"
          autoFocus
        />
        <p className="text-xs text-[var(--faint)] mb-5">
          New total: {currentStock + quantity}
        </p>

        {error && <p role="alert" className="text-xs text-[var(--danger)] mb-3">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={() => onConfirm(quantity)} disabled={submitting}>
            {submitting ? 'Saving…' : 'Add stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type SortKey = 'medication' | 'product' | 'stock';
type SortDir = 'asc' | 'desc';

export function InventoryPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const s = searchParams.get('sort');
    return s === 'medication' || s === 'product' || s === 'stock' ? s : 'medication';
  });
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    searchParams.get('dir') === 'desc' ? 'desc' : 'asc'
  );
  const [restocking, setRestocking] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { token } = useAuth();
  const [{ data, fetching, error }, refetch] = useQuery({ query: INVENTORY_QUERY });
  useRefetchOn('MedicinalProduct', () => refetch({ requestPolicy: 'network-only' }));

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  async function handleRestock(quantity: number) {
    if (!restocking) return;
    setSubmitting(true);
    setRestockError(null);
    try {
      await createApiClient(token!).post(`/products/${restocking.id}/restock`, { quantity });
      setRestocking(null);
    } catch (err) {
      setRestockError(err instanceof Error ? err.message : 'Restock failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const products = data?.medicinalProducts ?? [];
  const lowStockCount = products.filter(p => p.isBelowThreshold).length;

  const q = search.toLowerCase();
  const filtered = q
    ? products.filter(p =>
        p.medication?.innName.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        p.medication?.atcCode.toLowerCase().includes(q)
      )
    : products;

  const sorted = sortProducts(filtered, sortKey, sortDir);

  const th = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <th
      className={`px-4 py-3 font-medium text-[var(--text)] cursor-pointer select-none hover:text-[var(--ink)] whitespace-nowrap ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div>
      {restocking && (
        <RestockDialog
          productName={restocking.name}
          currentStock={restocking.stock}
          onConfirm={handleRestock}
          onCancel={() => { setRestocking(null); setRestockError(null); }}
          submitting={submitting}
          error={restockError}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          Inventory
          {lowStockCount > 0 && (
            <span className="ml-3 text-sm font-normal text-[var(--danger)]">
              ⚠ {lowStockCount} below threshold
            </span>
          )}
        </h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search medication or product…"
          className="w-64 rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tint)] text-left">
              {th('Medication', 'medication')}
              <th className="px-4 py-3 font-medium text-[var(--text)]">ATC Code</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">Form</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">Strength</th>
              {th('Product', 'product')}
              {th('Stock', 'stock', 'right')}
              <th className="px-4 py-3 font-medium text-[var(--text)] text-right">Min</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                <td className="px-4 py-3 font-medium text-[var(--ink)]">
                  {p.medication
                    ? <Link to={`/medications/${p.medication.id}`} className="text-accent hover:underline">{p.medication.innName}</Link>
                    : '—'}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] font-mono text-xs">{p.medication?.atcCode ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--text)]">{p.medication?.form ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--muted)] font-mono text-xs">{p.medication?.strength ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--text)]">
                  <Link to={`/inventory/${p.id}`} className="text-accent hover:underline">{p.productName}</Link>
                </td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.isBelowThreshold ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
                  {p.stockLevel}
                  {p.isBelowThreshold && <span className="ml-1 text-xs">⚠</span>}
                </td>
                <td className="px-4 py-3 text-right text-[var(--faint)] tabular-nums">{p.stockThreshold}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRestockError(null);
                      setRestocking({ id: p.id, name: p.productName, stock: p.stockLevel });
                    }}
                  >
                    + Restock
                  </Button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--faint)]">
                  {q ? 'No results.' : 'No products in inventory.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
