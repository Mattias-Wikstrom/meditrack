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
