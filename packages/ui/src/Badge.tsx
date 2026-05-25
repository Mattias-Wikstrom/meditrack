const styles: Record<string, string> = {
  Draft:     'bg-slate-100 text-slate-600',
  Sent:      'bg-blue-100 text-blue-700',
  Confirmed: 'bg-amber-100 text-amber-700',
  Delivered: 'bg-green-100 text-green-700',
};

interface BadgeProps {
  status: string;
}

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
