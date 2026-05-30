// Used for /audit (admin)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { useRefetchOn } from '@meditrack/client';
import { Card, Spinner, formatDateTimePrecise } from '@meditrack/ui';
import { graphql } from '../gql';

const AUDIT_QUERY = graphql(`
  query AdminAuditLog {
    auditLog {
      actorId
      action
      entityId
      occurredAt
    }
  }
`);

const _created  = 'bg-[var(--st-deliv-bg)] text-[var(--st-deliv-fg)]';
const _updated  = 'bg-[var(--st-sent-bg)]  text-[var(--st-sent-fg)]';
const _deleted  = 'bg-[var(--danger-bg)]   text-[var(--danger-fg)]';

const ACTION_STYLES: Record<string, string> = {
  DraftOrderCreated:  'bg-[var(--st-draft-bg)] text-[var(--st-draft-fg)]',
  OrderSent:          'bg-[var(--st-sent-bg)]  text-[var(--st-sent-fg)]',
  OrderConfirmed:     'bg-[var(--st-conf-bg)]  text-[var(--st-conf-fg)]',
  OrderDelivered:     'bg-[var(--st-deliv-bg)] text-[var(--st-deliv-fg)]',
  ActorLoggedIn:      _created,
  ActorLoginFailed:   _deleted,
  PasswordChanged:    'bg-[var(--accent-soft)] text-[var(--accent-ink)]',
  ProductRestocked:   _updated,
  ActorCreated:       _created,
  ActorUpdated:       _updated,
  ActorDeleted:       _deleted,
  WardUnitCreated:          _created,
  WardUnitUpdated:          _updated,
  WardUnitDeleted:          _deleted,
  MedicationCreated:        _created,
  MedicationUpdated:        _updated,
  MedicationDeleted:        _deleted,
  MedicinalProductCreated:  _created,
  MedicinalProductUpdated:  _updated,
  MedicinalProductDeleted:  _deleted,
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[action] ?? 'bg-[var(--bg-tint)] text-[var(--muted)]'}`}>
      {action}
    </span>
  );
}

function toEntityDetailsRoute(action: string, entityId: string): string | null {
  switch (action) {
    case 'ActorCreated':
    case 'ActorUpdated':
    case 'ActorLoggedIn':
    case 'ActorLoginFailed':
    case 'PasswordChanged':
      return `/users/${entityId}`;
    case 'WardUnitCreated':
    case 'WardUnitUpdated':
      return `/ward-units/${entityId}`;
    case 'MedicationCreated':
    case 'MedicationUpdated':
      return `/inventory/${entityId}`;
    case 'MedicinalProductCreated':
    case 'MedicinalProductUpdated':
      return `/inventory/products/${entityId}`;
    case 'ProductRestocked':
      return `/inventory/${entityId}`;
    case 'DraftOrderCreated':
    case 'OrderSent':
    case 'OrderConfirmed':
    case 'OrderDelivered':
      return `/orders/${entityId}`;
    default:
      return null;
  }
}

export function AuditPage() {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [{ data, fetching, error }, refetch] = useQuery({ query: AUDIT_QUERY, requestPolicy: 'cache-and-network' });
  useRefetchOn(['Order', 'Actor', 'WardUnit', 'Medication', 'MedicinalProduct'], () => refetch({ requestPolicy: 'network-only' }));

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const entries = data?.auditLog ?? [];

  const q = actorFilter.toLowerCase().trim();
  const filtered = entries.filter(e =>
    (!q || e.actorId.toLowerCase().includes(q)) &&
    (!actionFilter || e.action === actionFilter)
  );

  const allActions = Array.from(new Set(entries.map(e => e.action))).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          Audit Log
          <span className="ml-2 text-sm font-normal text-[var(--faint)]">{filtered.length}</span>
        </h1>
        <div className="flex gap-3">
          <input
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            placeholder="Filter by user…"
            className="w-44 rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">All actions</option>
            {allActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tint)] text-left">
              <th className="px-4 py-3 font-medium text-[var(--text)] whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">User</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">Action</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const detailsRoute = toEntityDetailsRoute(e.action, e.entityId);
              return (
              <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap tabular-nums">{formatDateTimePrecise(e.occurredAt)}</td>
                <td className="px-4 py-3 font-medium">
                  <Link to={`/users/${e.actorId}`} className="text-[var(--ink)] hover:text-accent hover:underline">{e.actorId}</Link>
                </td>
                <td className="px-4 py-3"><ActionBadge action={e.action} /></td>
                <td className="px-4 py-3 font-mono text-xs">
                  {detailsRoute ? (
                    <Link to={detailsRoute} className="text-accent hover:underline">
                      {e.entityId}
                    </Link>
                  ) : (
                    <span className="text-[var(--faint)]">{e.entityId}</span>
                  )}
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-[var(--faint)]">No audit events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
