import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from './BackButton';
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
  /**
   * If provided, a Restock section is rendered inside the Stock card.
   * The callback receives the quantity to add and should return null on
   * success or an error message string on failure.
   */
  onRestock?: (quantity: number) => Promise<string | null>;
  /** If provided, the INN name becomes a link to this href */
  getMedicationHref?: (medicationId: string) => string;
}


export function InventoryProductDetail({ product, onBack, onRestock, getMedicationHref }: InventoryProductDetailProps) {
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
    <div>
      <BackButton onClick={onBack} className="mb-4" />
      <h1 className="text-xl font-semibold text-slate-800 mb-1">{product.productName}</h1>
      <p className="text-xs text-slate-400 font-mono mb-6">{product.id}</p>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Medication</h2>
          <InfoRow label="INN Name">
            {product.medication
              ? getMedicationHref
                ? <Link to={getMedicationHref(product.medication.id)} className="text-accent hover:underline">{product.medication.innName}</Link>
                : product.medication.innName
              : '—'}
          </InfoRow>
          <InfoRow label="ATC Code">
            <span className="font-mono text-xs">{product.medication?.atcCode ?? '—'}</span>
          </InfoRow>
          <InfoRow label="Form">{product.medication?.form ?? '—'}</InfoRow>
          <InfoRow label="Strength">
            <span className="font-mono text-xs">{product.medication?.strength ?? '—'}</span>
          </InfoRow>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Stock</h2>
          <InfoRow label="Current level">
            <span className={`font-semibold tabular-nums ${product.isBelowThreshold ? 'text-red-600' : 'text-slate-800'}`}>
              {product.stockLevel}
              {product.isBelowThreshold && ' ⚠'}
            </span>
          </InfoRow>
          <InfoRow label="Minimum threshold">{product.stockThreshold}</InfoRow>
          <InfoRow label="Status">
            {product.isBelowThreshold
              ? <span className="text-red-600 font-medium">Below threshold</span>
              : <span className="text-green-600 font-medium">Adequate</span>
            }
          </InfoRow>

          {onRestock && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Restock</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Units to add</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => {
                      setSuccess(false);
                      setQty(Math.max(1, parseInt(e.target.value) || 1));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                  <p className="text-xs text-slate-400 mt-1">New total: {product.stockLevel + qty}</p>
                </div>
                <div className="pt-5">
                  <Button onClick={handleRestock} disabled={submitting}>
                    {submitting ? 'Saving…' : '+ Add stock'}
                  </Button>
                </div>
              </div>
              {error   && <p className="text-xs text-red-600 mt-2">{error}</p>}
              {success && <p className="text-xs text-green-600 mt-2">Stock updated successfully.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
