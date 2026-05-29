// Used for /users (admin)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { Button, Card, Spinner, RoleBadge, SortIcon } from '@meditrack/ui';
import { useAuth, createApiClient } from '@meditrack/client';
import { graphql } from '../gql';

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

const USERS_CHANGED_SUB = graphql(`
  subscription AdminUsersRepoChanged {
    repositoryChanged { entityType kind entityId }
  }
`);

const ROLES = ['Nurse', 'Pharmacist', 'Admin'] as const;
const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

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

  function handleRepoChanged(_: unknown, event: { repositoryChanged?: { entityType: string } | null }) {
    const t = event.repositoryChanged?.entityType;
    if (t === 'Actor' || t === 'WardUnit') refetch({ requestPolicy: 'network-only' });
    return undefined;
  }
  useSubscription({ query: USERS_CHANGED_SUB }, handleRepoChanged);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  type Actor = { id: string; role: string; wardUnitId?: string | null; wardUnit?: { name: string } | null };
  type WardUnit = { id: string; name: string };
  const actors: Actor[] = data?.actors ?? [];
  const wardUnits: WardUnit[] = data?.wardUnits ?? [];
  const filtered = roleFilter ? actors.filter(a => a.role === roleFilter) : actors;
  const sorted = [...filtered].sort((a, b) => {
    let av: string;
    let bv: string;
    if (sortKey === 'id') { av = a.id; bv = b.id; }
    else if (sortKey === 'role') { av = a.role; bv = b.role; }
    else { av = a.wardUnit?.name ?? a.wardUnitId ?? ''; bv = b.wardUnit?.name ?? b.wardUnitId ?? ''; }
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const th = (label: string, key: SortKey) => (
    <th
      className="text-left py-3 px-4 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap hover:text-slate-900"
      onClick={() => toggleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wardUnitId = fd.get('wardUnitId') as string | null;
    try {
      const actor = await createApiClient(token!).post<{ id: string }>('/actors', {
        id: fd.get('id') as string,
        role: fd.get('role') as string,
        wardUnitId: wardUnitId || undefined,
        password: fd.get('password') as string,
      });
      setShowCreate(false);
      setCreateError(null);
      navigate(`/users/${actor.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    }
  }

  return (
    <div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCreate(false); setCreateError(null); }} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-4">New User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                <input name="id" required placeholder="e.g. nurse.anna" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select name="role" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={inputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {selectedRole === 'Nurse' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ward Unit</label>
                  <select name="wardUnitId" required className={inputCls}>
                    <option value="">— Select ward unit —</option>
                    {wardUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input name="password" type="password" required className={inputCls} />
              </div>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setCreateError(null); }}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Users
          <span className="ml-2 text-sm font-normal text-slate-400">{sorted.length}</span>
        </h1>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">All roles</option>
            <option value="Nurse">Nurse</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Admin">Admin</option>
          </select>
          <Button onClick={() => { setShowCreate(true); setCreateError(null); setSelectedRole('Nurse'); }}>+ New User</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {th('Username', 'id')}
              {th('Role', 'role')}
              {th('Ward Unit', 'wardUnit')}
            </tr>
          </thead>
          <tbody>
            {sorted.map(actor => (
              <tr key={actor.id} onClick={() => navigate(`/users/${actor.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 px-4 font-medium text-slate-800">{actor.id}</td>
                <td className="py-3 px-4"><RoleBadge role={actor.role} /></td>
                <td className="py-3 px-4 text-slate-600">{actor.wardUnit?.name ?? actor.wardUnitId ?? <span className="text-slate-300">—</span>}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
