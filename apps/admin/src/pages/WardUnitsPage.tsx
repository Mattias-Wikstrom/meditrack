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

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const units: { id: string; name: string }[] = data?.wardUnits ?? [];

  function openCreate() { setIdValue(''); setIdTouched(false); setCreateError(null); setShowCreate(true); }
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
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">Ward Units</h1>
        <Button onClick={openCreate}>+ Add Ward Unit</Button>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th className="no-sort">Name</th>
              <th className="no-sort">ID</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit.id} className="clickable" onClick={() => navigate(`/ward-units/${unit.id}`)}>
                <td><span className="medname">{unit.name}</span></td>
                <td><span className="mono minicode">{unit.id}</span></td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr><td colSpan={2}><div className="empty">No ward units found.</div></td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {showCreate && (
        <div className="scrim" onMouseDown={() => setShowCreate(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Add Ward Unit</h3>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label className="label">Name</label>
                <input name="name" required className="input" placeholder="e.g. Akuten" onChange={handleNameChange} />
              </div>
              <div className="field">
                <label className="label">ID</label>
                <input
                  name="id"
                  required
                  className="input"
                  value={idValue}
                  onChange={e => { setIdTouched(true); setIdValue(e.target.value); }}
                  placeholder="e.g. ward-akuten"
                />
                <div className="hint">Auto-generated from name. You can edit it.</div>
              </div>
              {createError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{createError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Add Ward Unit</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
