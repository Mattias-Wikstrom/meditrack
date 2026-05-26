const ROLE_STYLES: Record<string, string> = {
  Nurse:      'bg-blue-100 text-blue-700',
  Pharmacist: 'bg-purple-100 text-purple-700',
  Admin:      'bg-amber-100 text-amber-700',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 shrink-0 mr-4">{label}</span>
      <span className="text-slate-800 text-right">{children}</span>
    </div>
  );
}

import type { OrderLineSummary } from './OrderCard';
import type { InventoryProduct } from './InventoryProductDetail';

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
    <div className="space-y-0.5">
      {shown.map(l => (
        <div key={l.medicationId} className="flex items-baseline gap-1.5">
          <span className="text-slate-700">{l.medication?.innName ?? l.medicationId}</span>
          <span className="text-slate-400 text-xs">×{l.quantity}</span>
        </div>
      ))}
      {extra > 0 && <div className="text-slate-400 text-xs">+{extra} more</div>}
    </div>
  );
}

export function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className={`ml-1 text-xs ${active ? 'text-slate-700' : 'invisible'}`}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

/** "1 Jan, 13:05" — day/month/time, no year */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** "1 Jan 2024, 13:05" — day/month/year/time */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** "1 Jan 2024, 13:05:30" — full timestamp with seconds, for audit logs */
export function formatDateTimePrecise(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}
