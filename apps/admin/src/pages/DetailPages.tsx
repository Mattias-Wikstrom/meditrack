import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { OrderStatusBadge, Button, Card, Spinner, InventoryProductDetail, InfoRow, RoleBadge, formatDate } from '@meditrack/ui';
import { useAuth, createApiClient, useRefetchOn } from '@meditrack/client';

const ROLES = ['Nurse', 'Pharmacist', 'Admin'] as const;

function NotFound({ kind, to }: { kind: string; to: string }) {
  const navigate = useNavigate();
  return <p className="subtle">No {kind} found. <button className="linkbtn" onClick={() => navigate(to)}>Back to list</button></p>;
}

// ── UserDetailsPage ───────────────────────────────────────────────────────────

const ACTORS_QUERY = `
  query AdminActorDetails {
    actors { id role wardUnitId wardUnit { name } }
    wardUnits { id name }
    auditLog { actorId action entityId occurredAt }
  }
`;

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const { token, actorId: currentActorId } = useAuth();
  const [{ data, fetching, error }, refetch] = useQuery({ query: ACTORS_QUERY });
  useRefetchOn(['Actor', 'WardUnit'], () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const actor = data?.actors.find((a: { id: string }) => a.id === userId);
  if (!actor) return <NotFound kind="user" to="/users" />;

  type WardUnit = { id: string; name: string };
  const wardUnits: WardUnit[] = data?.wardUnits ?? [];

  const recentActivity = (data?.auditLog ?? [])
    .filter((e: { actorId: string }) => e.actorId === userId)
    .slice(0, 20);

  function openEdit() { setEditRole(actor.role); setModalError(null); setModal('edit'); }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wardUnitId = fd.get('wardUnitId') as string | null;
    try {
      await createApiClient(token!).patch(`/actors/${userId}`, {
        role: fd.get('role') as string,
        wardUnitId: wardUnitId || null,
      });
      setModal(null); setModalError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  async function handleDelete() {
    try {
      await createApiClient(token!).del(`/actors/${userId}`);
      navigate('/users');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="backlink" onClick={() => navigate('/users')} style={{ marginBottom: 0 }}>← Users</button>
        <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>
          {userId !== currentActorId && (
            <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
          )}
        </div>
      </div>

      <h1 className="h1" style={{ marginBottom: 24 }}>{actor.id}</h1>

      <div className="grid-2">
        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Account</h2>
          <InfoRow label="Role"><RoleBadge role={actor.role} /></InfoRow>
          <InfoRow label="Ward Unit">
            {actor.wardUnit
              ? <Link to={`/ward-units/${actor.wardUnitId}`} className="link-cell">{actor.wardUnit.name}</Link>
              : <span style={{ color: 'var(--faint)' }}>—</span>}
          </InfoRow>
        </Card>

        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="subtle">No recorded activity.</div>
          ) : recentActivity.map((e: { action: string; entityId: string; occurredAt: string }, i: number) => (
            <div key={i} className="defrow">
              <span className="k" style={{ fontSize: 13 }}>{e.action}</span>
              <span className="mono" style={{ fontSize: 12.5, color: 'var(--faint)' }}>{formatDate(e.occurredAt)}</span>
            </div>
          ))}
        </Card>
      </div>

      {modal === 'edit' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <form onSubmit={handleUpdate}>
              <div className="field">
                <label className="label">Role</label>
                <select name="role" value={editRole} onChange={e => setEditRole(e.target.value)} className="select">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {editRole === 'Nurse' && (
                <div className="field">
                  <label className="label">Ward Unit</label>
                  <select name="wardUnitId" defaultValue={actor.wardUnitId ?? ''} className="select">
                    <option value="">— None —</option>
                    {wardUnits.map((u: WardUnit) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Delete User</h3>
            <div className="msub">Delete <strong>{actor.id}</strong>? This cannot be undone.</div>
            {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── WardUnitDetailsPage ───────────────────────────────────────────────────────

const WARD_UNIT_DETAIL_QUERY = `
  query AdminWardUnitDetail($id: ID!) {
    wardUnit(id: $id) {
      id name
      orders {
        id status createdAt
        lines { medicationId quantity medication { innName } }
      }
    }
    actors { id role wardUnitId }
  }
`;

export function WardUnitDetailsPage() {
  const navigate = useNavigate();
  const { wardUnitId } = useParams();
  const { token } = useAuth();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: WARD_UNIT_DETAIL_QUERY,
    variables: { id: wardUnitId },
  });
  useRefetchOn(['WardUnit', 'Actor', 'Order'], () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const unit = data?.wardUnit;
  if (!unit) return <NotFound kind="ward unit" to="/ward-units" />;

  const nurses = (data?.actors ?? []).filter((a: { wardUnitId?: string }) => a.wardUnitId === wardUnitId);
  const orders = [...(unit.orders ?? [])].sort(
    (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)
  );

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).patch(`/ward-units/${wardUnitId}`, { name: fd.get('name') as string });
      setModal(null); setModalError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update ward unit');
    }
  }

  async function handleDelete() {
    try {
      await createApiClient(token!).del(`/ward-units/${wardUnitId}`);
      navigate('/ward-units');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to delete ward unit');
    }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="backlink" onClick={() => navigate('/ward-units')} style={{ marginBottom: 0 }}>← Ward Units</button>
        <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => { setModalError(null); setModal('edit'); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 className="h1">{unit.name}</h1>
        <div className="subtle mono" style={{ marginTop: 4, fontSize: 12.5 }}>{unit.id}</div>
      </div>

      <div className="grid-2-wide">
        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>
            Nurses <span style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 14, marginLeft: 6 }}>{nurses.length}</span>
          </h2>
          {nurses.length === 0 ? (
            <div className="subtle">No nurses assigned.</div>
          ) : nurses.map((n: { id: string }) => (
            <Link key={n.id} to={`/users/${n.id}`} className="link-cell" style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>{n.id}</Link>
          ))}
        </Card>

        <Card className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <div className="card-hd" style={{ padding: '16px 0', border: 'none' }}>
            <h2 className="h2">Orders <span style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 14, marginLeft: 6 }}>{orders.length}</span></h2>
          </div>
          {orders.length === 0 ? (
            <div className="empty" style={{ paddingTop: 20, paddingBottom: 24 }}>No orders yet.</div>
          ) : orders.map((o: { id: string; status: string; createdAt: string; lines: { medicationId: string; medication?: { innName: string } | null; quantity: number }[] }) => (
            <div key={o.id} className="line" style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.id}`)}>
              <div>
                <div className="lname">{o.lines.map(l => l.medication?.innName ?? l.medicationId).join(', ')}</div>
                <div className="lmeta">{formatDate(o.createdAt)}</div>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
          ))}
        </Card>
      </div>

      {modal === 'edit' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Edit Ward Unit</h3>
            <form onSubmit={handleUpdate}>
              <div className="field"><label className="label">Name</label>
                <input name="name" defaultValue={unit.name} required className="input" /></div>
              {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Delete Ward Unit</h3>
            <div className="msub">Delete <strong>{unit.name}</strong>? This cannot be undone. All assigned nurses must be reassigned first.</div>
            {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── MedicationDetailsPage (product detail) ────────────────────────────────────

const PRODUCT_DETAIL_QUERY = `
  query AdminProductDetail($id: ID!) {
    medicinalProduct(id: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`;

export function MedicationDetailsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { token } = useAuth();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId },
  });
  useRefetchOn('MedicinalProduct', () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const product = data?.medicinalProduct;
  if (!product) return <NotFound kind="medication product" to="/inventory" />;

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).patch(`/products/${productId}`, {
        productName: fd.get('productName') as string,
        stockThreshold: parseInt(fd.get('stockThreshold') as string),
      });
      setModal(null); setModalError(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update product');
    }
  }

  async function handleDelete() {
    try {
      await createApiClient(token!).del(`/products/${productId}`);
      navigate('/inventory');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  return (
    <>
      <InventoryProductDetail
        product={product}
        onBack={() => navigate('/inventory')}
        getMedicationHref={id => `/medications/${id}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setModalError(null); setModal('edit'); }}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
          </>
        }
      />

      {modal === 'edit' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Edit Product</h3>
            <form onSubmit={handleUpdate}>
              <div className="field"><label className="label">Product Name</label>
                <input name="productName" defaultValue={product.productName} required className="input" /></div>
              <div className="field"><label className="label">Minimum Threshold</label>
                <input name="stockThreshold" type="number" min={0} defaultValue={product.stockThreshold} required className="input" /></div>
              {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="scrim" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <div className="msub">Delete <strong>{product.productName}</strong>? This cannot be undone.</div>
            {modalError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{modalError}</p>}
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
