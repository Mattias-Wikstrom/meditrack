import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Button, Spinner, SortIcon, sortProducts } from '@meditrack/ui';
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

type SortKey = 'medication' | 'product' | 'stock';
type SortDir = 'asc' | 'desc';

export function InventoryPage() {
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

  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  type Product = { id: string; productName: string; stockLevel: number; stockThreshold: number; isBelowThreshold: boolean; medication?: { id: string; innName: string; atcCode: string; form: string; strength: string } | null };
  const products: Product[] = data?.medicinalProducts ?? [];
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
    <th className={align === 'right' ? 'ar' : ''} onClick={() => handleSort(key)}>
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  async function handleCreateMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).post<{ id: string }>('/medications', {
        innName: fd.get('innName') as string,
        atcCode: fd.get('atcCode') as string,
        form: fd.get('form') as string,
        strength: fd.get('strength') as string,
      });
      setShowCreate(false);
      setCreateError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create medication');
    }
  }

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">
          Inventory
          {lowStockCount > 0 && <span style={{ marginLeft: 12 }}><span className="badge danger-soft">{lowStockCount} below threshold</span></span>}
        </h1>
        <div className="row" style={{ gap: 10 }}>
          <div className="search" style={{ width: 240 }}>
            <span className="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="input" />
          </div>
          <Button onClick={() => { setShowCreate(true); setCreateError(null); }}>+ New Medication</Button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              {th('Medication', 'medication')}
              <th className="no-sort">ATC</th>
              <th className="no-sort">Form</th>
              {th('Product', 'product')}
              {th('Stock', 'stock', 'right')}
              <th className="no-sort ar">Min</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td>
                  {p.medication
                    ? <Link to={`/medications/${p.medication.id}`} className="link-cell">{p.medication.innName}</Link>
                    : '—'}
                </td>
                <td><span className="mono minicode">{p.medication?.atcCode ?? '—'}</span></td>
                <td>{p.medication?.form ?? '—'}</td>
                <td><Link to={`/inventory/${p.id}`} className="link-cell" style={{ fontWeight: 500 }}>{p.productName}</Link></td>
                <td className={`num ${p.isBelowThreshold ? 'stock-low' : 'stock-ok'}`}>
                  {p.stockLevel}{p.isBelowThreshold && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                </td>
                <td className="ar" style={{ color: 'var(--muted)' }}>{p.stockThreshold}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6}><div className="empty">{q ? 'No results.' : 'No products in inventory.'}</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="scrim" onMouseDown={() => { setShowCreate(false); setCreateError(null); }}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>New Medication</h3>
            <form onSubmit={handleCreateMedication}>
              <div className="field"><label className="label">INN Name</label>
                <input name="innName" required placeholder="e.g. Paracetamol" className="input" /></div>
              <div className="field"><label className="label">ATC Code</label>
                <input name="atcCode" required placeholder="e.g. N02BE01" className="input" /></div>
              <div className="field"><label className="label">Form</label>
                <select name="form" className="select">{FORMS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="field"><label className="label">Strength</label>
                <input name="strength" required placeholder="e.g. 500 mg" className="input" /></div>
              {createError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{createError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setCreateError(null); }}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
