// Used for /inventory (admin)
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Button, Spinner, SortIcon, sortProducts } from '@meditrack/ui';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const MEDICATIONS_QUERY = graphql(`
  query AdminMedications {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

const FORMS = ['Tablet', 'Capsule', 'Injection', 'Solution', 'Cream', 'Drops', 'Inhaler'] as const;
const inputCls = 'w-full rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

type SortKey = 'medication' | 'product' | 'stock';
type SortDir = 'asc' | 'desc';

export function InventoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const s = searchParams.get('sort');
    return s === 'medication' || s === 'product' || s === 'stock' ? s : 'medication';
  });
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    searchParams.get('dir') === 'desc' ? 'desc' : 'asc'
  );

  const [{ data, fetching, error }, refetch] = useQuery({ query: MEDICATIONS_QUERY, requestPolicy: 'cache-and-network' });
  useRefetchOn('MedicinalProduct', () => refetch({ requestPolicy: 'network-only' }));

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
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

  async function handleCreateMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const medication = await createApiClient(token!).post<{ id: string }>('/medications', {
        innName: fd.get('innName') as string,
        atcCode: fd.get('atcCode') as string,
        form: fd.get('form') as string,
        strength: fd.get('strength') as string,
      });
      setShowCreate(false);
      setCreateError(null);
      navigate(`/medications/${medication.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create medication');
    }
  }

  return (
    <div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCreate(false); setCreateError(null); }} />
          <div className="relative bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border)] p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-4">New Medication</h2>
            <form onSubmit={handleCreateMedication} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">INN Name</label>
                <input name="innName" required placeholder="e.g. Paracetamol" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">ATC Code</label>
                <input name="atcCode" required placeholder="e.g. N02BE01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">Form</label>
                <select name="form" className={inputCls}>
                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">Strength</label>
                <input name="strength" required placeholder="e.g. 500 mg" className={inputCls} />
              </div>
              {createError && <p role="alert" className="text-xs text-[var(--danger)]">{createError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setCreateError(null); }}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
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
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medication or product…"
            className="w-64 rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <Button onClick={() => { setShowCreate(true); setCreateError(null); }}>+ New Medication</Button>
        </div>
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
                <td className="px-4 py-3 text-[var(--text)]"><Link to={`/inventory/${p.id}`} className="text-accent hover:underline">{p.productName}</Link></td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.isBelowThreshold ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
                  {p.stockLevel}
                  {p.isBelowThreshold && <span className="ml-1 text-xs">⚠</span>}
                </td>
                <td className="px-4 py-3 text-right text-[var(--faint)] tabular-nums">{p.stockThreshold}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--faint)]">
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
