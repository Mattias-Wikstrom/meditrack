import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { Button, Card, Spinner, RoleBadge, SortIcon } from '@meditrack/ui';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';

const ACTORS_QUERY = /* GraphQL */ `
  query AdminActors {
    actors {
      id
      role
      wardUnitId
      wardUnit { id name }
    }
    wardUnits { id name }
  }
`;

const ROLES = ['Nurse', 'Pharmacist', 'Admin'] as const;

type SortKey = 'id' | 'role' | 'wardUnit';
type SortDir = 'asc' | 'desc';

export function UsersPage() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Nurse');

  const { token } = useAuth();
  const [{ data, fetching, error }, refetch] = useQuery({ query: ACTORS_QUERY });
  useRefetchOn(['Actor', 'WardUnit'], () => refetch({ requestPolicy: 'network-only' }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  type Actor = { id: string; role: string; wardUnitId?: string | null; wardUnit?: { name: string } | null };
  type WardUnit = { id: string; name: string };
  const actors: Actor[] = data?.actors ?? [];
  const wardUnits: WardUnit[] = data?.wardUnits ?? [];
  const filtered = roleFilter ? actors.filter(a => a.role === roleFilter) : actors;
  const sorted = [...filtered].sort((a, b) => {
    let av: string, bv: string;
    if (sortKey === 'id') { av = a.id; bv = b.id; }
    else if (sortKey === 'role') { av = a.role; bv = b.role; }
    else { av = a.wardUnit?.name ?? a.wardUnitId ?? ''; bv = b.wardUnit?.name ?? b.wardUnitId ?? ''; }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wardUnitId = fd.get('wardUnitId') as string | null;
    try {
      await createApiClient(token!).post<{ id: string }>('/actors', {
        id: fd.get('id') as string,
        role: fd.get('role') as string,
        wardUnitId: wardUnitId || undefined,
        password: fd.get('password') as string,
      });
      setShowCreate(false);
      setCreateError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    }
  }

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggleSort(key)}>
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">Users</h1>
        <div className="row" style={{ gap: 10 }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="select"
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button onClick={() => setShowCreate(true)}>+ Add User</Button>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              {th('User ID', 'id')}
              {th('Role', 'role')}
              {th('Ward Unit', 'wardUnit')}
            </tr>
          </thead>
          <tbody>
            {sorted.map(actor => (
              <tr key={actor.id} className="clickable" onClick={() => navigate(`/users/${actor.id}`)}>
                <td><span className="medname">{actor.id}</span></td>
                <td><RoleBadge role={actor.role} /></td>
                <td>{actor.wardUnit?.name ?? <span style={{ color: 'var(--faint)' }}>—</span>}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={3}><div className="empty">No users found.</div></td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {showCreate && (
        <div className="scrim" onMouseDown={() => setShowCreate(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Add User</h3>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label className="label">User ID</label>
                <input name="id" required className="input" placeholder="e.g. nurse-john" />
              </div>
              <div className="field">
                <label className="label">Role</label>
                <select name="role" className="select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {selectedRole === 'Nurse' && (
                <div className="field">
                  <label className="label">Ward Unit</label>
                  <select name="wardUnitId" className="select">
                    <option value="">None</option>
                    {wardUnits.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label className="label">Password</label>
                <input name="password" type="password" required className="input" autoComplete="new-password" />
              </div>
              {createError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{createError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Add User</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
