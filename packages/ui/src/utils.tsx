import type { OrderLineSummary } from './OrderCard';
import type { InventoryProduct } from './InventoryProductDetail';

const ROLE_CLS: Record<string, string> = {
  Nurse:      'role-nurse',
  Pharmacist: 'role-pharmacist',
  Admin:      'role-admin',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`badge ${ROLE_CLS[role] ?? 'soft'}`}>{role}</span>
  );
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="defrow">
      <span className="k">{label}</span>
      <span className="v">{children}</span>
    </div>
  );
}

export function sortProducts(
  products: InventoryProduct[],
  key: 'medication' | 'product' | 'stock',
  dir: 'asc' | 'desc',
): InventoryProduct[] {
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

export const STATUS_RANK: Record<string, number> = { Draft: 0, Sent: 1, Confirmed: 2, Delivered: 3 };

export function LineList({ lines, limit }: { lines: OrderLineSummary[]; limit?: number }) {
  const shown = limit !== undefined ? lines.slice(0, limit) : lines;
  const extra = limit !== undefined ? Math.max(0, lines.length - limit) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {shown.map(l => (
        <div key={l.medicationId}>
          <span className="medname">{l.medication?.innName ?? l.medicationId}</span>
          {' '}
          <span className="subtle mono">×{l.quantity}</span>
        </div>
      ))}
      {extra > 0 && <div style={{ color: 'var(--faint)', fontSize: 12.5 }}>+{extra} more</div>}
    </div>
  );
}

export function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return null;
  return <span style={{ marginLeft: 5, fontSize: 11, color: 'var(--text)' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatDateTimePrecise(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}
