import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { BackButton, Badge, Card, Spinner, InventoryProductDetail } from '@meditrack/ui';

// ── shared helpers ────────────────────────────────────────────────────────────

function NotFound({ kind, to }: { kind: string; to: string }) {
  return (
    <p className="text-sm text-slate-500">
      No {kind} found.{' '}
      <a className="text-accent hover:underline" href={to}>Back to list</a>.
    </p>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500 shrink-0 mr-4">{label}</span>
      <span className="text-slate-800 text-right">{children}</span>
    </div>
  );
}

const ROLE_STYLES: Record<string, string> = {
  Nurse:      'bg-blue-100 text-blue-700',
  Pharmacist: 'bg-purple-100 text-purple-700',
  Admin:      'bg-amber-100 text-amber-700',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

// ── UserDetailsPage ───────────────────────────────────────────────────────────

const ACTORS_QUERY = `
  query AdminActorDetails {
    actors { id role wardUnitId wardUnit { name } }
    auditLog { actorId action entityId occurredAt }
  }
`;

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [{ data, fetching, error }] = useQuery({ query: ACTORS_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const actor = data?.actors.find((a: { id: string }) => a.id === userId);
  if (!actor) return <NotFound kind="user" to="/users" />;

  const recentActivity = (data?.auditLog ?? [])
    .filter((e: { actorId: string }) => e.actorId === userId)
    .slice(0, 20);

  return (
    <div>
      <BackButton onClick={() => navigate('/users')} className="mb-4" />
      <h1 className="text-xl font-semibold text-slate-800 mb-6">{actor.id}</h1>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Account</h2>
          <InfoRow label="Role"><RoleBadge role={actor.role} /></InfoRow>
          <InfoRow label="Ward Unit">{actor.wardUnit?.name ?? <span className="text-slate-300">—</span>}</InfoRow>
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
    </div>
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
  const [{ data, fetching, error }] = useQuery({
    query: WARD_UNIT_DETAIL_QUERY,
    variables: { id: wardUnitId },
  });

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

  return (
    <div>
      <BackButton onClick={() => navigate('/ward-units')} className="mb-4" />
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
                <div key={n.id} className="py-1.5 border-b border-slate-100 last:border-0 text-sm text-slate-700">{n.id}</div>
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
                    <tr key={o.id} className="border-b border-slate-100 last:border-0">
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
    </div>
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

export function MedicationDetailsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [{ data, fetching, error }] = useQuery({
    query: PRODUCT_DETAIL_QUERY,
    variables: { id: productId },
  });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const product = data?.medicinalProduct;
  if (!product) return <NotFound kind="medication product" to="/inventory" />;

  return (
    <InventoryProductDetail
      product={product}
      onBack={() => navigate('/inventory')}
      getMedicationHref={id => `/medications/${id}`}
    />
  );
}

// ── WardOrdersPage (/orders/:wardUnitId) ──────────────────────────────────────

const WARD_ORDERS_QUERY = `
  query AdminWardOrders($id: ID!) {
    wardUnit(id: $id) {
      id name
      orders {
        id status createdAt
        lines { medicationId quantity medication { innName } }
      }
    }
  }
`;

export function WardOrdersPage() {
  const navigate = useNavigate();
  const { wardUnitId } = useParams();
  const [{ data, fetching, error }] = useQuery({
    query: WARD_ORDERS_QUERY,
    variables: { id: wardUnitId },
  });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const unit = data?.wardUnit;
  if (!unit) return <NotFound kind="ward unit" to="/orders" />;

  const orders = [...(unit.orders ?? [])].sort(
    (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div>
      <BackButton onClick={() => navigate('/orders')} className="mb-4" />
      <h1 className="text-xl font-semibold text-slate-800 mb-1">
        Orders — {unit.name}
        <span className="ml-2 text-sm font-normal text-slate-400">{orders.length}</span>
      </h1>
      <p className="text-xs text-slate-400 font-mono mb-6">{unit.id}</p>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Created</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Medications</th>
              <th className="px-4 py-3 font-medium text-slate-600">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: { id: string; status: string; createdAt: string; lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[] }) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
                <td className="px-4 py-3 text-slate-600">
                  {o.lines.map(l => `${l.medication?.innName ?? l.medicationId} ×${l.quantity}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{o.id}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">No orders for this ward unit.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
