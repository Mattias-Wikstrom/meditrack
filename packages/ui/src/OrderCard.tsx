// No longer used
import React from 'react';
import { Card } from './Card';
import { OrderStatusBadge } from './OrderStatusBadge';

export interface OrderLineSummary {
  medicationId: string;
  quantity: number;
  medication?: { innName: string } | null;
}

export interface OrderSummary {
  id: string;
  wardUnitId: string;
  status: string;
  createdAt: string;
  lines: OrderLineSummary[];
}

interface OrderCardProps {
  order: OrderSummary;
  children?: React.ReactNode;
}

export function OrderCard({ order, children }: OrderCardProps) {
  const shortId = order.id.slice(0, 8);
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-slate-400 mb-0.5">{shortId}…</p>
          <p className="text-sm text-slate-500">Ward <span className="font-medium text-slate-700">{order.wardUnitId}</span> · {date}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <ul className="space-y-1 mb-4">
        {order.lines.map((line, i) => (
          <li key={i} className="text-sm text-slate-600 flex justify-between">
            <span>{line.medication?.innName ?? line.medicationId}</span>
            <span className="text-slate-400">× {line.quantity}</span>
          </li>
        ))}
      </ul>
      {children}
    </Card>
  );
}
