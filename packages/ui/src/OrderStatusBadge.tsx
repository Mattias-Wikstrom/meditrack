// Used to display order status
const styles: Record<string, string> = {
  Draft:     'bg-[var(--st-draft-bg)] text-[var(--st-draft-fg)]',
  Sent:      'bg-[var(--st-sent-bg)]  text-[var(--st-sent-fg)]',
  Confirmed: 'bg-[var(--st-conf-bg)]  text-[var(--st-conf-fg)]',
  Delivered: 'bg-[var(--st-deliv-bg)] text-[var(--st-deliv-fg)]',
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles['Draft']}`}>
      {status}
    </span>
  );
}
