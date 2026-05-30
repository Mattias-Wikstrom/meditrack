const STATUS_CLS: Record<string, string> = {
  Draft:     'draft',
  Sent:      'sent',
  Confirmed: 'confirmed',
  Delivered: 'delivered',
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const cls = STATUS_CLS[status] ?? 'draft';
  return (
    <span className={`badge ${cls}`}>
      <span className="pdot" />
      {status}
    </span>
  );
}
