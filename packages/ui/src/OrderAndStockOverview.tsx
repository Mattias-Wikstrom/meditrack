import { Link } from 'react-router-dom';

export interface OverviewProduct {
  id: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
  isBelowThreshold: boolean;
  medication?: { innName: string; atcCode: string; strength: string } | null;
}

export interface OverviewOrder {
  id: string;
  status: string;
}

export interface OrderAndStockOverviewProps {
  products: OverviewProduct[];
  orders: OverviewOrder[];
  getProductHref?: (productId: string) => string;
  inventoryHref?: string;
  lowStockHref?: string;
  ordersHref?: string;
}

const ORDER_STATUSES = ['Draft', 'Sent', 'Confirmed', 'Delivered'] as const;
const ORDER_STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft', Sent: 'Submitted', Confirmed: 'Confirmed', Delivered: 'Delivered',
};
const STATUS_CLS: Record<string, string> = {
  Draft: 'draft', Sent: 'sent', Confirmed: 'confirmed', Delivered: 'delivered',
};

export function OrderAndStockOverview({ products, orders, getProductHref, inventoryHref, lowStockHref, ordersHref }: OrderAndStockOverviewProps) {
  const lowStock = products.filter(p => p.isBelowThreshold);
  const active = orders.filter(o => o.status !== 'Delivered').length;
  const byStatus = (s: string) => orders.filter(o => o.status === s).length;

  const tileContent = (value: number, label: string, note: string, alert = false) => (
    <div className={`tile${alert && value > 0 ? ' alert' : ''}`}>
      {alert && value > 0 && (
        <span className="tcorner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4"/><path d="M12 17h.01"/>
            <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
          </svg>
        </span>
      )}
      <div className="tval">{value}</div>
      <div className="tlabel">{label}</div>
      <div className="tnote">{note}</div>
    </div>
  );

  return (
    <div className="stack">
      <div className="tiles">
        {inventoryHref
          ? <Link to={inventoryHref} style={{ textDecoration: 'none' }}>{tileContent(products.length, 'Total Medications', 'In drug registry')}</Link>
          : tileContent(products.length, 'Total Medications', 'In drug registry')}
        {lowStockHref
          ? <Link to={lowStockHref} style={{ textDecoration: 'none' }}>{tileContent(lowStock.length, 'Low Stock Alerts', 'Below minimum threshold', true)}</Link>
          : tileContent(lowStock.length, 'Low Stock Alerts', 'Below minimum threshold', true)}
        {ordersHref
          ? <Link to={ordersHref} style={{ textDecoration: 'none' }}>{tileContent(orders.length, 'Total Orders', 'All time orders')}</Link>
          : tileContent(orders.length, 'Total Orders', 'All time orders')}
        {tileContent(active, 'Pending Orders', 'Awaiting completion')}
      </div>

      <div className="grid-2">
        <div className={`alertcard${lowStock.length > 0 ? '' : ''}`}>
          <div className="alert-hd">
            <div className="t">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4"/><path d="M12 17h.01"/>
                <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
              </svg>
              Low Stock Alerts
            </div>
            <div className="s">{lowStock.length} medication{lowStock.length !== 1 ? 's' : ''} below minimum threshold</div>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty" style={{ paddingTop: 20, paddingBottom: 24 }}>All stock levels are adequate.</div>
          ) : (
            lowStock.map(product => {
              const inner = (
                <>
                  <div>
                    <div className="ln">{product.productName}</div>
                    <div className="lm">{product.medication?.innName ?? '—'} · {product.medication?.atcCode ?? '—'}</div>
                  </div>
                  <div className="chip">
                    <span className="now">{product.stockLevel}</span>
                    <span className="arrow">→</span>
                    <span className="min">{product.stockThreshold} min</span>
                  </div>
                </>
              );
              return getProductHref ? (
                <Link key={product.id} to={getProductHref(product.id)} className="lowrow">{inner}</Link>
              ) : (
                <div key={product.id} className="lowrow">{inner}</div>
              );
            })
          )}
        </div>

        <div className="card card-pad">
          <h2 className="h2" style={{ marginBottom: 14 }}>Quick Stats</h2>
          {ORDER_STATUSES.map(status => (
            <div key={status} className="qstat">
              <span className="k">{ORDER_STATUS_LABELS[status]}</span>
              <span className="row" style={{ gap: 8 }}>
                <span className="v">{byStatus(status)}</span>
                <span className={`badge ${STATUS_CLS[status]}`}><span className="pdot" /></span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
