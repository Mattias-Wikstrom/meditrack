import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { Button } from './Button';
import { Card } from './Card';
import { InfoRow } from './utils';

export interface InventoryProduct {
  id: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
  isBelowThreshold: boolean;
  medication?: {
    id: string;
    innName: string;
    atcCode: string;
    form: string;
    strength: string;
  } | null;
}

export interface InventoryProductDetailProps {
  product: InventoryProduct;
  onBack: () => void;
  actions?: React.ReactNode;
  onRestock?: (quantity: number) => Promise<string | null>;
  getMedicationHref?: (medicationId: string) => string;
}

export function InventoryProductDetail({ product, onBack, actions, onRestock, getMedicationHref }: InventoryProductDetailProps) {
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRestock() {
    if (!onRestock) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const err = await onRestock(qty);
    setSubmitting(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setQty(1);
  }

  return (
    <div className="stack">
      <PageHeader onBack={onBack} actions={actions} />
      <div>
        <h1 className="h1">{product.productName}</h1>
        <div className="subtle mono" style={{ marginTop: 4, fontSize: 12.5 }}>{product.id}</div>
      </div>

      <div className="grid-2">
        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Medication</h2>
          <InfoRow label="INN Name">
            {product.medication
              ? getMedicationHref
                ? <Link to={getMedicationHref(product.medication.id)} className="link-cell">{product.medication.innName}</Link>
                : product.medication.innName
              : '—'}
          </InfoRow>
          <InfoRow label="ATC Code">
            <span className="mono" style={{ fontSize: 13 }}>{product.medication?.atcCode ?? '—'}</span>
          </InfoRow>
          <InfoRow label="Form">{product.medication?.form ?? '—'}</InfoRow>
          <InfoRow label="Strength">
            <span className="mono" style={{ fontSize: 13 }}>{product.medication?.strength ?? '—'}</span>
          </InfoRow>
        </Card>

        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Stock</h2>
          <InfoRow label="Current level">
            <span className={product.isBelowThreshold ? 'stock-low' : 'stock-ok'}>
              {product.stockLevel}{product.isBelowThreshold ? ' ⚠' : ''}
            </span>
          </InfoRow>
          <InfoRow label="Minimum threshold">{product.stockThreshold}</InfoRow>
          <InfoRow label="Status">
            {product.isBelowThreshold
              ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Below threshold</span>
              : <span style={{ color: 'var(--ok)', fontWeight: 600 }}>Adequate</span>}
          </InfoRow>

          {onRestock && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h2 className="h2" style={{ marginBottom: 14 }}>Restock</h2>
              <div className="row" style={{ alignItems: 'flex-end', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Units to add</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => { setSuccess(false); setQty(Math.max(1, parseInt(e.target.value) || 1)); }}
                    className="input"
                    style={{ width: '100%' }}
                  />
                  <div className="hint">New total: {product.stockLevel + qty}</div>
                </div>
                <Button onClick={handleRestock} disabled={submitting}>
                  {submitting ? 'Saving…' : '+ Add stock'}
                </Button>
              </div>
              {error   && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
              {success && <p className="success-text" style={{ marginTop: 8 }}>Stock updated successfully.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
