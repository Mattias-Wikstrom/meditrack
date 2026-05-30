import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { Card } from './Card';
import { InfoRow } from './utils';

export interface MedicationDetailProduct {
  id: string;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
  isBelowThreshold: boolean;
}

export interface MedicationDetailData {
  id: string;
  innName: string;
  atcCode: string;
  form: string;
  strength: string;
}

export interface MedicationDetailProps {
  medication: MedicationDetailData;
  products: MedicationDetailProduct[];
  onBack: () => void;
  getProductHref?: (productId: string) => string;
}

export function MedicationDetail({ medication, products, onBack, getProductHref }: MedicationDetailProps) {
  return (
    <div className="stack">
      <PageHeader onBack={onBack} />
      <div>
        <h1 className="h1">{medication.innName}</h1>
        <div className="subtle mono" style={{ marginTop: 4, fontSize: 12.5 }}>{medication.atcCode}</div>
      </div>

      <div className="grid-2">
        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Medication</h2>
          <InfoRow label="INN Name">{medication.innName}</InfoRow>
          <InfoRow label="ATC Code"><span className="mono" style={{ fontSize: 13 }}>{medication.atcCode}</span></InfoRow>
          <InfoRow label="Form">{medication.form}</InfoRow>
          <InfoRow label="Strength"><span className="mono" style={{ fontSize: 13 }}>{medication.strength}</span></InfoRow>
        </Card>

        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>
            Products <span style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 14, marginLeft: 6 }}>{products.length}</span>
          </h2>
          {products.length === 0 ? (
            <div className="empty" style={{ padding: '20px 0' }}>No products registered.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="no-sort">Product</th>
                  <th className="no-sort num">Stock</th>
                  <th className="no-sort num">Min</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      {getProductHref ? (
                        <Link to={getProductHref(p.id)} className="link-cell">{p.productName}</Link>
                      ) : p.productName}
                    </td>
                    <td className={`num ${p.isBelowThreshold ? 'stock-low' : 'stock-ok'}`}>
                      {p.stockLevel}{p.isBelowThreshold && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                    </td>
                    <td className="num" style={{ color: 'var(--muted)' }}>{p.stockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
