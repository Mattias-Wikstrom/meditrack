import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const ACTORS_QUERY = graphql(`
  query AdminActors {
    actors {
      id
      role
      wardUnit { name }
    }
  }
`);

const ROLE_STYLES: Record<string, string> = {
  Nurse:       'bg-blue-100 text-blue-700',
  Pharmacist:  'bg-purple-100 text-purple-700',
  Admin:       'bg-amber-100 text-amber-700',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

type SortKey = 'id' | 'role' | 'wardUnit';
type SortDir = 'asc' | 'desc';

export function UsersPage() {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [roleFilter, setRoleFilter] = useState('');

  const [{ data, fetching, error }] = useQuery({ query: ACTORS_QUERY });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const actors = data?.actors ?? [];
  const filtered = roleFilter ? actors.filter(a => a.role === roleFilter) : actors;
  const sorted = [...filtered].sort((a, b) => {
    let av: string;
    let bv: string;
    if (sortKey === 'id') { av = a.id; bv = b.id; }
    else if (sortKey === 'role') { av = a.role; bv = b.role; }
    else { av = a.wardUnit?.name ?? ''; bv = b.wardUnit?.name ?? ''; }
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    return (
      <span className={`ml-1 text-xs ${active ? 'text-slate-700' : 'invisible'}`}>
        {dir === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  const th = (label: string, key: SortKey) => (
    <th
      className="text-left py-3 px-4 font-medium text-slate-600 cursor-pointer select-none whitespace-nowrap hover:text-slate-900"
      onClick={() => toggleSort(key)}
    >
      {label}<SortIcon active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Users
          <span className="ml-2 text-sm font-normal text-slate-400">{sorted.length}</span>
        </h1>
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
              <tr key={actor.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-800"><Link to={`/users/${actor.id}`} className="text-accent hover:underline">{actor.id}</Link></td>
                <td className="py-3 px-4"><RoleBadge role={actor.role} /></td>
                <td className="py-3 px-4 text-slate-600">{actor.wardUnit?.name ?? <span className="text-slate-300">—</span>}</td>
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
