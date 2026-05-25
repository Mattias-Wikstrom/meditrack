import { Link, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Badge, Spinner } from '@meditrack/ui';
import { EntityDetailsCard } from '../components/EntityDetailsCard';

const ACTORS_QUERY = `
  query AdminActorDetails {
    actors {
      id
      role
      wardUnit { id name }
    }
  }
`;

const WARD_UNITS_QUERY = `
  query AdminWardUnitDetails {
    wardUnits { id name }
  }
`;

const MEDICATIONS_QUERY = `
  query AdminMedicationDetails {
    medicinalProducts {
      id productName stockLevel stockThreshold isBelowThreshold
      medication { id innName atcCode form strength }
    }
  }
`;

const ORDERS_QUERY = `
  query AdminOrderDetails {
    orders {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`;

const NotFound = ({ kind, to }: { kind: string; to: string }) => <p className="text-sm text-slate-500">No {kind} found. <Link className="text-accent hover:underline" to={to}>Back to list</Link>.</p>;

export function UserDetailsPage() {
  const { userId } = useParams();
  const [{ data, fetching, error }] = useQuery({ query: ACTORS_QUERY });
  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;
  const actor = data?.actors.find(a => a.id === userId);
  if (!actor) return <NotFound kind="user" to="/users" />;

  return <EntityDetailsCard title={actor.id} subtitle="User details" fields={[
    { label: 'Role', value: actor.role },
    { label: 'Ward unit', value: actor.wardUnit?.name ?? '—' },
    { label: 'Ward unit ID', value: actor.wardUnit?.id ?? '—' },
  ]} />;
}

export function WardUnitDetailsPage() {
  const { orderId } = useParams();
  const [{ data, fetching, error }] = useQuery({ query: WARD_UNITS_QUERY });
  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;
  const unit = data?.wardUnits.find(w => w.id === wardUnitId);
  if (!unit) return <NotFound kind="ward unit" to="/ward-units" />;

  return <EntityDetailsCard title={unit.name} subtitle="Ward unit details" fields={[
    { label: 'Name', value: unit.name },
    { label: 'ID', value: <span className="font-mono text-xs text-slate-500">{unit.id}</span> },
  ]} />;
}

export function MedicationDetailsPage() {
  const { productId } = useParams();
  const [{ data, fetching, error }] = useQuery({ query: MEDICATIONS_QUERY });
  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;
  const product = data?.medicinalProducts.find(p => p.id === productId);
  if (!product) return <NotFound kind="medication product" to="/medications" />;

  return <EntityDetailsCard title={product.productName} subtitle="Medication product details" fields={[
    { label: 'Product ID', value: <span className="font-mono text-xs text-slate-500">{product.id}</span> },
    { label: 'Medication', value: product.medication?.innName ?? '—' },
    { label: 'ATC code', value: product.medication?.atcCode ?? '—' },
    { label: 'Form', value: product.medication?.form ?? '—' },
    { label: 'Strength', value: product.medication?.strength ?? '—' },
    { label: 'Stock level', value: product.stockLevel },
    { label: 'Threshold', value: product.stockThreshold },
    { label: 'Status', value: product.isBelowThreshold ? 'Below threshold' : 'In stock' },
  ]} />;
}

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const [{ data, fetching, error }] = useQuery({ query: ORDERS_QUERY });
  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;
  const order = data?.orders.find(o => o.id === orderId);
  if (!order) return <NotFound kind="order" to="/" />;

  return <EntityDetailsCard title={`Order for ${order.wardUnitId}`} subtitle="Order details" fields={[
    { label: 'Order ID', value: <span className="font-mono text-xs text-slate-500">{order.id}</span> },
    { label: 'Ward Unit', value: order.wardUnitId },
    { label: 'Status', value: <Badge status={order.status} /> },
    { label: 'Created', value: new Date(order.createdAt).toLocaleString('en-GB') },
    { label: 'Lines', value: order.lines.length === 0 ? '—' : (
      <ul className="space-y-1">
        {order.lines.map(line => <li key={line.medicationId}>{line.medication?.innName ?? line.medicationId} ×{line.quantity}</li>)}
      </ul>
    ) },
  ]} />;
}
