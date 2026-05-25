import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Spinner } from '@meditrack/ui';
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

const ACTION_STYLES: Record<string, string> = {
  DraftOrderCreated:  'bg-slate-100 text-slate-600',
  OrderSent:          'bg-blue-100 text-blue-700',
  OrderConfirmed:     'bg-amber-100 text-amber-700',
  OrderDelivered:     'bg-green-100 text-green-700',
  ActorLoggedIn:      'bg-teal-100 text-teal-700',
  ActorLoginFailed:   'bg-red-100 text-red-700',
  PasswordChanged:    'bg-purple-100 text-purple-700',
  ProductRestocked:   'bg-indigo-100 text-indigo-700',
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[action] ?? 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  );
}

function toEntityDetailsRoute(action: string, entityId: string): string | null {
  switch (action) {
    case 'ActorLoggedIn':
    case 'ActorLoginFailed':
    case 'PasswordChanged':
      return `/users/${entityId}`;
    case 'ProductRestocked':
      return `/medications/${entityId}`;
    case 'DraftOrderCreated':
    case 'OrderSent':
    case 'OrderConfirmed':
    case 'OrderDelivered':
      return `/orders/${entityId}`;
    default:
      return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function AuditPage() {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [{ data, fetching, error }] = useQuery({ query: AUDIT_QUERY, requestPolicy: 'cache-and-network' });

  if (fetching && !data) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

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
        <h1 className="text-xl font-semibold text-slate-800">
          Audit Log
          <span className="ml-2 text-sm font-normal text-slate-400">{filtered.length}</span>
        </h1>
        <div className="flex gap-3">
          <input
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            placeholder="Filter by user…"
            className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">All actions</option>
            {allActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 font-medium text-slate-600">User</th>
              <th className="px-4 py-3 font-medium text-slate-600">Action</th>
              <th className="px-4 py-3 font-medium text-slate-600">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const detailsRoute = toEntityDetailsRoute(e.action, e.entityId);
              return (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums">{formatDate(e.occurredAt)}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{e.actorId}</td>
                <td className="px-4 py-3"><ActionBadge action={e.action} /></td>
                <td className="px-4 py-3 font-mono text-xs">
                  {detailsRoute ? (
                    <Link to={detailsRoute} className="text-accent hover:underline">
                      {e.entityId}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{e.entityId}</span>
                  )}
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">No audit events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
