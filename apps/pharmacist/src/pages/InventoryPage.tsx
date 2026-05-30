import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Button, Spinner, SortIcon, sortProducts } from '@meditrack/ui';
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
    <div className="scrim" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <h3>Restock</h3>
        <div className="msub">{productName} · currently <strong style={{ color: 'var(--ink)' }}>{currentStock}</strong> in stock</div>
        <div className="field">
          <label className="label">Units to add</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="input"
            autoFocus
          />
          <div className="hint">New total: {currentStock + quantity}</div>
        </div>
        {error && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
        <div className="modal-actions">
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
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  async function handleRestock(quantity: number) {
    if (!restocking) return;
    setSubmitting(true);
    setRestockError(null);
    try {
      await createApiClient(token!).post(`/products/${restocking.id}/restock`, { quantity });
      setRestocking(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setRestockError(err instanceof Error ? err.message : 'Restock failed');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">
          Inventory
          {lowStockCount > 0 && <span style={{ marginLeft: 12 }}><span className="badge danger-soft">{lowStockCount} low stock</span></span>}
        </h1>
        <div className="search" style={{ width: 260 }}>
          <span className="ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medications…"
            className="input"
          />
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              {th('Medication', 'medication')}
              {th('Product', 'product')}
              {th('Stock', 'stock', 'right')}
              <th className="no-sort ar">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id} className="clickable" onClick={() => {}}>
                <td>
                  {p.medication
                    ? <Link to={`/medications/${p.medication.id}`} className="link-cell" onClick={e => e.stopPropagation()}>{p.medication.innName}</Link>
                    : '—'}
                  {p.medication && <div className="minicode mono">{p.medication.atcCode} · {p.medication.form} · {p.medication.strength}</div>}
                </td>
                <td>
                  <Link to={`/inventory/${p.id}`} className="link-cell" style={{ fontWeight: 500 }}>{p.productName}</Link>
                </td>
                <td className={`num ${p.isBelowThreshold ? 'stock-low' : 'stock-ok'}`}>
                  {p.stockLevel}
                  {p.isBelowThreshold && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                  <div className="minicode" style={{ fontWeight: 400 }}>min {p.stockThreshold}</div>
                </td>
                <td className="ar">
                  <Button size="sm" variant="ghost"
                    onClick={() => setRestocking({ id: p.id, name: p.productName, stock: p.stockLevel })}>
                    Restock
                  </Button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={4}><div className="empty">No products found.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
