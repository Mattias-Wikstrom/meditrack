import { ReactNode } from 'react';
import { Card } from '@meditrack/ui';

type Field = {
  label: string;
  value: ReactNode;
};

export function EntityDetailsCard({ title, subtitle, fields }: { title: string; subtitle?: string; fields: Field[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>

      <Card className="overflow-hidden">
        <dl className="divide-y divide-[var(--border)]">
          {fields.map(field => (
            <div key={field.label} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:grid-cols-[180px,1fr] sm:gap-4">
              <dt className="font-medium text-[var(--muted)]">{field.label}</dt>
              <dd className="text-[var(--ink)]">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
