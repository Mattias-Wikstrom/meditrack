// Used for /ward-units (admin)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'urql';
import { Button, Card, Spinner } from '@meditrack/ui';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';
import { graphql } from '../gql';

const WARD_UNITS_QUERY = graphql(`
  query AdminWardUnits {
    wardUnits {
      id
      name
    }
  }
`);

const inputCls = 'w-full rounded-lg border border-[var(--border-2)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function WardUnitsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [idValue, setIdValue] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [{ data, fetching, error }, refetch] = useQuery({ query: WARD_UNITS_QUERY, requestPolicy: 'cache-and-network' });
  useRefetchOn('WardUnit', () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-[var(--danger)] text-sm">Error: {error.message}</p>;

  const units = data?.wardUnits ?? [];

  function openCreate() {
    setIdValue('');
    setIdTouched(false);
    setCreateError(null);
    setShowCreate(true);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!idTouched) setIdValue(slugify(e.target.value));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).post<{ id: string }>('/ward-units', {
        id: fd.get('id') as string,
        name: fd.get('name') as string,
      });
      setShowCreate(false);
      setCreateError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create ward unit');
    }
  }

  return (
    <div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border)] p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-4">New Ward Unit</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">Name</label>
                <input name="name" required placeholder="e.g. Ward 4B" onChange={handleNameChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">ID</label>
                <input
                  name="id"
                  required
                  value={idValue}
                  onChange={e => { setIdTouched(true); setIdValue(e.target.value); }}
                  className={inputCls}
                />
              </div>
              {createError && <p role="alert" className="text-xs text-[var(--danger)]">{createError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 min-h-[38px]">
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          Ward Units
          <span className="ml-2 text-sm font-normal text-[var(--faint)]">{units.length}</span>
        </h1>
        <Button onClick={openCreate}>+ New Ward Unit</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tint)] text-left">
              <th className="px-4 py-3 font-medium text-[var(--text)]">Name</th>
              <th className="px-4 py-3 font-medium text-[var(--text)]">ID</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit.id} onClick={() => navigate(`/ward-units/${unit.id}`)} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] cursor-pointer">
                <td className="px-4 py-3 font-medium text-[var(--ink)]">{unit.name}</td>
                <td className="px-4 py-3 text-[var(--faint)] font-mono text-xs">{unit.id}</td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-[var(--faint)]">No ward units found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
