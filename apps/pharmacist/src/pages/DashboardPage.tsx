import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

type OrderRow = {
  id: string;
  wardUnitId: string;
  status: string;
  createdAt: string;
  lines: { medicationId: string; quantity: number; medication?: { innName: string } | null }[];
};

import { useQuery } from 'urql';
import { OrderStatusBadge, Button, Spinner, LineList, formatDate } from '@meditrack/ui';
import { useOrdersApi } from '../api/orders';
import { graphql } from '../gql';
import { useRefetchOn } from '@meditrack/client';

const ORDERS_QUERY = graphql(`
  query PharmacistOrders {
    sent: orders(status: Sent) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
    confirmed: orders(status: Confirmed) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
    delivered: orders(status: Delivered) {
      id wardUnitId status createdAt
      lines { medicationId quantity medication { innName } }
    }
  }
`);

export function DashboardPage() {
  const navigate = useNavigate();
  const ordersApi = useOrdersApi();
  const [showDelivered, setShowDelivered] = useState(false);
  const [{ data, fetching, error }, refetch] = useQuery({ query: ORDERS_QUERY, requestPolicy: 'cache-and-network' });

  useRefetchOn('Order', () => refetch({ requestPolicy: 'network-only' }));

  async function handleConfirm(orderId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await ordersApi.confirm(orderId);
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to confirm order');
    }
  }

  if (fetching && !data) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const sent      = data?.sent ?? [];
  const confirmed = data?.confirmed ?? [];
  const delivered = [...(data?.delivered ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="stack">
      <div className="h-row">
        <h1 className="h1">
          Orders
          {sent.length > 0 && <span className="count" style={{ marginLeft: 12 }}><span className="badge soft">{sent.length} pending</span></span>}
        </h1>
      </div>

      <section>
        <div className="card-hd card" style={{ borderRadius: 'var(--r-card) var(--r-card) 0 0', borderBottom: 'none' }}>
          <h2 className="h2">Pending Confirmation</h2>
          {sent.length > 0 && <span className="badge sent">{sent.length}</span>}
        </div>
        <div className="card" style={{ borderRadius: '0 0 var(--r-card) var(--r-card)' }}>
          <table className="tbl">
            <thead><tr>
              <th className="no-sort">Created</th>
              <th className="no-sort">Ward</th>
              <th className="no-sort">Medications</th>
              <th className="no-sort">Status</th>
              <th className="no-sort ar" />
            </tr></thead>
            <tbody>
              {(sent as OrderRow[]).map(order => (
                <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                  <td><span className="mono minicode">{order.wardUnitId}</span></td>
                  <td><LineList lines={order.lines} /></td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td className="ar"><Button size="sm" onClick={(e) => handleConfirm(order.id, e)}>Confirm →</Button></td>
                </tr>
              ))}
              {sent.length === 0 && <tr><td colSpan={5}><div className="empty">No orders awaiting confirmation.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="card-hd card" style={{ borderRadius: 'var(--r-card) var(--r-card) 0 0', borderBottom: 'none' }}>
          <h2 className="h2">Ready to Deliver</h2>
          {confirmed.length > 0 && <span className="badge confirmed">{confirmed.length}</span>}
        </div>
        <div className="card" style={{ borderRadius: '0 0 var(--r-card) var(--r-card)' }}>
          <table className="tbl">
            <thead><tr>
              <th className="no-sort">Created</th>
              <th className="no-sort">Ward</th>
              <th className="no-sort">Medications</th>
              <th className="no-sort">Status</th>
              <th className="no-sort ar" />
            </tr></thead>
            <tbody>
              {(confirmed as OrderRow[]).map(order => (
                <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                  <td><span className="mono minicode">{order.wardUnitId}</span></td>
                  <td><LineList lines={order.lines} /></td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td className="ar">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>Deliver →</Button>
                  </td>
                </tr>
              ))}
              {confirmed.length === 0 && <tr><td colSpan={5}><div className="empty">No orders ready for delivery.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {delivered.length > 0 && (
        <>
          <button className="collapse-hd" onClick={() => setShowDelivered(v => !v)}>
            <span className={`caret${showDelivered ? ' open' : ''}`}>›</span>
            Delivered <span style={{ color: 'var(--faint)' }}>({delivered.length})</span>
          </button>
          {showDelivered && (
            <div className="card" style={{ opacity: .7 }}>
              <table className="tbl">
                <thead><tr>
                  <th className="no-sort">Created</th>
                  <th className="no-sort">Ward</th>
                  <th className="no-sort">Medications</th>
                  <th className="no-sort">Status</th>
                </tr></thead>
                <tbody>
                  {(delivered as OrderRow[]).map(order => (
                    <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                      <td><span className="mono minicode">{order.wardUnitId}</span></td>
                      <td><LineList lines={order.lines} /></td>
                      <td><OrderStatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
