import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Spinner, SortIcon } from '@meditrack/ui';
import { graphql } from '../gql';

const MEDICATIONS_QUERY = graphql(`
  query AdminMedications {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`);

type SortKey = 'medication' | 'product' | 'stock';
type SortDir = 'asc' | 'desc';

type Product = {
  id: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
  isBelowThreshold: boolean;
  medication?: { id: string; innName: string; atcCode: string; form: string; strength: string } | null;
};

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  const sorted = [...products].sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (key) {
      case 'medication': av = a.medication?.innName ?? ''; bv = b.medication?.innName ?? ''; break;
      case 'product':    av = a.productName; bv = b.productName; break;
      case 'stock':      av = a.stockLevel; bv = b.stockLevel; break;
    }
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return dir === 'asc' ? sorted : sorted.reverse();
}

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

  const [{ data, fetching, error }] = useQuery({ query: MEDICATIONS_QUERY });

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

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
      className={`px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 whitespace-nowrap ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Inventory
          {lowStockCount > 0 && (
            <span className="ml-3 text-sm font-normal text-red-600">
              ⚠ {lowStockCount} below threshold
            </span>
          )}
        </h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search medication or product…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {th('Medication', 'medication')}
              <th className="px-4 py-3 font-medium text-slate-600">ATC Code</th>
              <th className="px-4 py-3 font-medium text-slate-600">Form</th>
              <th className="px-4 py-3 font-medium text-slate-600">Strength</th>
              {th('Product', 'product')}
              {th('Stock', 'stock', 'right')}
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Min</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {p.medication
                    ? <Link to={`/medications/${p.medication.id}`} className="text-accent hover:underline">{p.medication.innName}</Link>
                    : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.medication?.atcCode ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{p.medication?.form ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.medication?.strength ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600"><Link to={`/inventory/${p.id}`} className="text-accent hover:underline">{p.productName}</Link></td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.isBelowThreshold ? 'text-red-600' : 'text-slate-800'}`}>
                  {p.stockLevel}
                  {p.isBelowThreshold && <span className="ml-1 text-xs">⚠</span>}
                </td>
                <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{p.stockThreshold}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
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
