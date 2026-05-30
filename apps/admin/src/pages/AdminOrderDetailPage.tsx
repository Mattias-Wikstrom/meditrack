import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { OrderStatusBadge, Card, Spinner, formatDateTime } from '@meditrack/ui';
import { useRefetchOn } from '@meditrack/client';

const ORDER_DETAIL_QUERY = `
  query AdminOrderDetail($id: ID!) {
    order(id: $id) {
      id wardUnitId wardUnit { name } status createdAt
      lines {
        medicationId quantity
        medication { innName }
      }
    }
  }
`;

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [{ data, fetching, error }, refetch] = useQuery({
    query: ORDER_DETAIL_QUERY,
    variables: { id: orderId },
    requestPolicy: 'network-only',
  });
  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const order = data?.order;
  if (!order) return (
    <p className="subtle">Order not found. <button className="linkbtn" onClick={() => navigate('/orders')}>Back to list</button></p>
  );

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <button className="backlink" onClick={() => navigate('/orders')}>← Orders</button>

      <div className="row" style={{ gap: 14 }}>
        <h1 className="h1">Order</h1>
        <OrderStatusBadge status={order.status} />
        <span className="subtle mono" style={{ fontSize: 12.5 }}>{order.id.slice(0, 8)}…</span>
      </div>

      <Card className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
        <div className="defrow">
          <span className="k">Ward Unit</span>
          <Link to={`/ward-units/${order.wardUnitId}`} className="link-cell">{order.wardUnit?.name ?? order.wardUnitId}</Link>
        </div>
        <div className="defrow">
          <span className="k">Created</span>
          <span className="v">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="defrow">
          <span className="k">Order ID</span>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--faint)' }}>{order.id}</span>
        </div>
      </Card>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th className="no-sort">Medication</th>
              <th className="no-sort num">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: { medicationId: string; quantity: number; medication?: { innName: string } | null }) => (
              <tr key={line.medicationId}>
                <td>{line.medication?.innName ?? line.medicationId}</td>
                <td className="num">{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
