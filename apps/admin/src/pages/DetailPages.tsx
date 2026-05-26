import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'urql';
import { BackButton, Badge, Button, Card, Spinner, InventoryProductDetail, InfoRow, RoleBadge, formatDate } from '@meditrack/ui';

const dialogInputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

// ── shared helpers ────────────────────────────────────────────────────────────

function NotFound({ kind, to }: { kind: string; to: string }) {
  return (
    <p className="text-sm text-slate-500">
      No {kind} found.{' '}
      <a className="text-accent hover:underline" href={to}>Back to list</a>.
    </p>
  );
}


// ── UserDetailsPage ───────────────────────────────────────────────────────────

const ACTORS_QUERY = `
  query AdminActorDetails {
    actors { id role wardUnitId wardUnit { name } }
    wardUnits { id name }
    auditLog { actorId action entityId occurredAt }
  }
`;

const UPDATE_ACTOR = `
  mutation AdminUpdateActor($id: ID!, $role: String, $wardUnitId: ID) {
    updateActor(id: $id, role: $role, wardUnitId: $wardUnitId) { id role wardUnitId }
  }
`;

const DELETE_ACTOR = `
  mutation AdminDeleteActor($id: ID!) {
    deleteActor(id: $id)
  }
`;

const ROLES = ['Nurse', 'Pharmacist', 'Admin'] as const;

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const [{ data, fetching, error }, refetch] = useQuery({ query: ACTORS_QUERY });
  const [, updateActor] = useMutation(UPDATE_ACTOR);
  const [, deleteActor] = useMutation(DELETE_ACTOR);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const actor = data?.actors.find((a: { id: string }) => a.id === userId);
  if (!actor) return <NotFound kind="user" to="/users" />;

  type WardUnit = { id: string; name: string };
  const wardUnits: WardUnit[] = data?.wardUnits ?? [];

  const recentActivity = (data?.auditLog ?? [])
    .filter((e: { actorId: string }) => e.actorId === userId)
    .slice(0, 20);

  function openEdit() {
    setEditRole(actor.role);
    setModalError(null);
    setModal('edit');
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const wardUnitId = fd.get('wardUnitId') as string | null;
    const result = await updateActor({
      id: userId,
      role: fd.get('role') as string,
      wardUnitId: wardUnitId || null,
    });
    if (result.error) { setModalError(result.error.message); return; }
    setModal(null);
    setModalError(null);
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleDelete() {
    const result = await deleteActor({ id: userId });
    if (result.error) { setModalError(result.error.message); return; }
    navigate('/users');
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <BackButton onClick={() => navigate('/users')} />
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
        </div>
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">{actor.id}</h1>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Account</h2>
          <InfoRow label="Role"><RoleBadge role={actor.role} /></InfoRow>
          <InfoRow label="Ward Unit">
            {actor.wardUnit
              ? <Link to={`/ward-units/${actor.wardUnitId}`} className="text-accent hover:underline">{actor.wardUnit.name}</Link>
              : <span className="text-slate-300">—</span>}
          </InfoRow>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Recent Activity</h2>
          {recentActivity.length === 0
            ? <p className="text-sm text-slate-400">No recorded activity.</p>
            : (
              <div className="space-y-2">
                {recentActivity.map((e: { action: string; entityId: string; occurredAt: string }, i: number) => (
                  <div key={i} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-600">{e.action}</span>
                    <span className="text-slate-400 tabular-nums">{formatDate(e.occurredAt)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select name="role" value={editRole} onChange={e => setEditRole(e.target.value)} className={dialogInputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {editRole === 'Nurse' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ward Unit</label>
                  <select name="wardUnitId" required defaultValue={actor.wardUnitId ?? ''} className={dialogInputCls}>
                    <option value="" disabled>— Select ward unit —</option>
                    {wardUnits.map((u: WardUnit) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              {modalError && <p className="text-xs text-red-600">{modalError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delete User</h2>
            <p className="text-sm text-slate-600 mb-4">
              Delete <strong>{actor.id}</strong>? This cannot be undone.
            </p>
            {modalError && <p className="text-xs text-red-600 mb-3">{modalError}</p>}
            <div className="flex gap-2 justify-end">
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

const UPDATE_WARD_UNIT = `
  mutation AdminUpdateWardUnit($id: ID!, $name: String!) {
    updateWardUnit(id: $id, name: $name) { id name }
  }
`;

const DELETE_WARD_UNIT = `
  mutation AdminDeleteWardUnit($id: ID!) {
    deleteWardUnit(id: $id)
  }
`;

export function WardUnitDetailsPage() {
  const navigate = useNavigate();
  const { wardUnitId } = useParams();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: WARD_UNIT_DETAIL_QUERY,
    variables: { id: wardUnitId },
  });
  const [, updateWardUnit] = useMutation(UPDATE_WARD_UNIT);
  const [, deleteWardUnit] = useMutation(DELETE_WARD_UNIT);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const unit = data?.wardUnit;
  if (!unit) return <NotFound kind="ward unit" to="/ward-units" />;

  const nurses = (data?.actors ?? []).filter(
    (a: { wardUnitId?: string }) => a.wardUnitId === wardUnitId
  );
  const orders = [...(unit.orders ?? [])].sort(
    (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)
  );

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await updateWardUnit({ id: wardUnitId, name: fd.get('name') as string });
    if (result.error) { setModalError(result.error.message); return; }
    setModal(null);
    setModalError(null);
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleDelete() {
    const result = await deleteWardUnit({ id: wardUnitId });
    if (result.error) { setModalError(result.error.message); return; }
    navigate('/ward-units');
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <BackButton onClick={() => navigate('/ward-units')} />
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setModalError(null); setModal('edit'); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
        </div>
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-1">{unit.name}</h1>
      <p className="text-xs text-slate-400 font-mono mb-6">{unit.id}</p>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-4">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Nurses
            <span className="ml-2 text-sm font-normal text-slate-400">{nurses.length}</span>
          </h2>
          {nurses.length === 0
            ? <p className="text-sm text-slate-400">No nurses assigned.</p>
            : nurses.map((n: { id: string }) => (
                <Link key={n.id} to={`/users/${n.id}`} className="block py-1.5 border-b border-slate-100 last:border-0 text-sm text-accent hover:underline">
                  {n.id}
                </Link>
              ))
          }
        </Card>

        <Card className="p-5 col-span-2">
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Orders
            <span className="ml-2 text-sm font-normal text-slate-400">{orders.length}</span>
          </h2>
          {orders.length === 0
            ? <p className="text-sm text-slate-400">No orders yet.</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-2 font-medium text-slate-500">Created</th>
                    <th className="pb-2 font-medium text-slate-500">Status</th>
                    <th className="pb-2 font-medium text-slate-500">Medications</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: { id: string; status: string; createdAt: string; lines: { medicationId: string; medication?: { innName: string } | null; quantity: number }[] }) => (
                    <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                      <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      <td className="py-2 pr-4"><Badge status={o.status} /></td>
                      <td className="py-2 text-slate-600">
                        {o.lines.map(l => l.medication?.innName ?? l.medicationId).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      </div>

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Edit Ward Unit</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input name="name" defaultValue={unit.name} required className={dialogInputCls} />
              </div>
              {modalError && <p className="text-xs text-red-600">{modalError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delete Ward Unit</h2>
            <p className="text-sm text-slate-600 mb-4">
              Delete <strong>{unit.name}</strong>? This cannot be undone. All assigned nurses must be reassigned first.
            </p>
            {modalError && <p className="text-xs text-red-600 mb-3">{modalError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── MedicationDetailsPage ─────────────────────────────────────────────────────

const PRODUCT_DETAIL_QUERY = `
  query AdminProductDetail($id: ID!) {
    medicinalProduct(id: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation AdminDetailUpdateProduct($id: ID!, $productName: String, $stockThreshold: Int) {
    updateMedicinalProduct(id: $id, productName: $productName, stockThreshold: $stockThreshold) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`;

const DELETE_PRODUCT_MUTATION = `
  mutation AdminDetailDeleteProduct($id: ID!) {
    deleteMedicinalProduct(id: $id)
  }
`;

const productInputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

export function MedicationDetailsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [modal, setModal] = useState<'edit' | 'confirmDelete' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId },
  });
  const [, updateProduct] = useMutation(UPDATE_PRODUCT_MUTATION);
  const [, deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const product = data?.medicinalProduct;
  if (!product) return <NotFound kind="medication product" to="/inventory" />;

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await updateProduct({
      id: productId,
      productName: fd.get('productName') as string,
      stockThreshold: parseInt(fd.get('stockThreshold') as string),
    });
    if (result.error) { setModalError(result.error.message); return; }
    setModal(null);
    setModalError(null);
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleDelete() {
    const result = await deleteProduct({ id: productId });
    if (result.error) { setModalError(result.error.message); return; }
    navigate('/inventory');
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <BackButton onClick={() => navigate('/inventory')} />
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setModalError(null); setModal('edit'); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { setModalError(null); setModal('confirmDelete'); }}>Delete</Button>
        </div>
      </div>

      <InventoryProductDetail
        product={product}
        onBack={() => navigate('/inventory')}
        getMedicationHref={id => `/medications/${id}`}
      />

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Edit Product</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
                <input name="productName" defaultValue={product.productName} required className={productInputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Threshold</label>
                <input name="stockThreshold" type="number" min={0} defaultValue={product.stockThreshold} required className={productInputCls} />
              </div>
              {modalError && <p className="text-xs text-red-600">{modalError}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'confirmDelete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delete Product</h2>
            <p className="text-sm text-slate-600 mb-4">
              Delete <strong>{product.productName}</strong>? This cannot be undone.
            </p>
            {modalError && <p className="text-xs text-red-600 mb-3">{modalError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
