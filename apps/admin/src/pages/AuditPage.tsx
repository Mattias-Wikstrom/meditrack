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

function actionCls(action: string): string {
  if (action.endsWith('Created'))      return 'action-created';
  if (action.endsWith('Updated'))      return 'action-updated';
  if (action.endsWith('Deleted'))      return 'action-deleted';
  if (action.includes('LoggedIn') || action.includes('Login')) return 'action-login';
  if (action === 'OrderDelivered')     return 'action-delivered';
  if (action.includes('Order'))        return 'action-order';
  if (action.includes('Password'))     return 'action-password';
  if (action.includes('Restocked'))    return 'action-restock';
  return 'action-default';
}

function toEntityRoute(action: string, entityId: string): string | null {
  if (['ActorCreated','ActorUpdated','ActorLoggedIn','ActorLoginFailed','PasswordChanged'].includes(action))
    return `/users/${entityId}`;
  if (['WardUnitCreated','WardUnitUpdated'].includes(action))
    return `/ward-units/${entityId}`;
  if (['MedicationCreated','MedicationUpdated','ProductRestocked'].includes(action))
    return `/inventory/${entityId}`;
  if (['MedicinalProductCreated','MedicinalProductUpdated'].includes(action))
    return `/inventory/products/${entityId}`;
  if (['DraftOrderCreated','OrderSent','OrderConfirmed','OrderDelivered'].includes(action))
    return `/orders/${entityId}`;
  return null;
}

export function AuditPage() {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [{ data, fetching, error }, refetch] = useQuery({ query: AUDIT_QUERY, requestPolicy: 'cache-and-network' });
  useRefetchOn(['Order', 'Actor', 'WardUnit', 'Medication', 'MedicinalProduct'], () => refetch({ requestPolicy: 'network-only' }));

  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  type AuditEntry = { actorId: string; action: string; entityId: string; occurredAt: string };
  const entries: AuditEntry[] = data?.auditLog ?? [];
  const q = actorFilter.toLowerCase().trim();
  const filtered = entries.filter((e: AuditEntry) =>
    (!q || e.actorId.toLowerCase().includes(q)) &&
    (!actionFilter || e.action === actionFilter)
  );
  const allActions: string[] = Array.from(new Set(entries.map((e: AuditEntry) => e.action))).sort();

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">
          Audit Log
          <span style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 20, marginLeft: 10 }}>{filtered.length}</span>
        </h1>
        <div className="row" style={{ gap: 10 }}>
          <input
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            placeholder="Filter by user…"
            className="input"
            style={{ width: 180 }}
          />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">All actions</option>
            {allActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th className="no-sort">Timestamp</th>
              <th className="no-sort">User</th>
              <th className="no-sort">Action</th>
              <th className="no-sort">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const route = toEntityRoute(e.action, e.entityId);
              return (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="mono" style={{ fontSize: 13 }}>{formatDateTimePrecise(e.occurredAt)}</span>
                  </td>
                  <td>
                    <Link to={`/users/${e.actorId}`} className="link-cell">{e.actorId}</Link>
                  </td>
                  <td>
                    <span className={`badge ${actionCls(e.action)}`}>{e.action}</span>
                  </td>
                  <td>
                    {route ? (
                      <Link to={route} className="link-cell mono" style={{ fontSize: 12.5 }}>{e.entityId}</Link>
                    ) : (
                      <span className="mono minicode">{e.entityId}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={4}><div className="empty">No audit events found.</div></td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
