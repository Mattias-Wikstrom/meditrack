import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'urql';
import { Button, Card, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const WARD_UNITS_QUERY = graphql(`
  query AdminWardUnits {
    wardUnits {
      id
      name
    }
  }
`);

const CREATE_WARD_UNIT = `
  mutation AdminCreateWardUnit($name: String!) {
    createWardUnit(name: $name) { id }
  }
`;

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

export function WardUnitsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [{ data, fetching, error }] = useQuery({ query: WARD_UNITS_QUERY });
  const [, createWardUnit] = useMutation(CREATE_WARD_UNIT);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const units = data?.wardUnits ?? [];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await createWardUnit({ name: fd.get('name') as string });
    if (result.error) { setCreateError(result.error.message); return; }
    setShowCreate(false);
    setCreateError(null);
    const id = result.data?.createWardUnit?.id;
    if (id) navigate(`/ward-units/${id}`);
  }

  return (
    <div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCreate(false); setCreateError(null); }} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-4">New Ward Unit</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input name="name" required placeholder="e.g. Ward 4B" className={inputCls} />
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

      <div className="flex items-center justify-between mb-6 min-h-[38px]">
        <h1 className="text-xl font-semibold text-slate-800">
          Ward Units
          <span className="ml-2 text-sm font-normal text-slate-400">{units.length}</span>
        </h1>
        <Button onClick={() => { setShowCreate(true); setCreateError(null); }}>+ New Ward Unit</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">ID</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit.id} onClick={() => navigate(`/ward-units/${unit.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-medium text-slate-800">{unit.name}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{unit.id}</td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-slate-400">No ward units found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
