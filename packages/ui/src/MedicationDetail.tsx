import { Link } from 'react-router-dom';
import { BackButton } from './BackButton';
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
  /** If provided, product names in the table become links to this href */
  getProductHref?: (productId: string) => string;
}


export function MedicationDetail({ medication, products, onBack, getProductHref }: MedicationDetailProps) {
  return (
    <div>
      <BackButton onClick={onBack} className="mb-4" />
      <h1 className="text-xl font-semibold text-slate-800 mb-1">{medication.innName}</h1>
      <p className="text-xs text-slate-400 font-mono mb-6">{medication.atcCode}</p>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Medication</h2>
          <InfoRow label="INN Name">{medication.innName}</InfoRow>
          <InfoRow label="ATC Code">
            <span className="font-mono text-xs">{medication.atcCode}</span>
          </InfoRow>
          <InfoRow label="Form">{medication.form}</InfoRow>
          <InfoRow label="Strength">
            <span className="font-mono text-xs">{medication.strength}</span>
          </InfoRow>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">
            Products
            <span className="ml-2 text-sm font-normal text-slate-400">{products.length}</span>
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400">No products registered.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-medium text-slate-500">Product</th>
                  <th className="pb-2 font-medium text-slate-500 text-right">Stock</th>
                  <th className="pb-2 font-medium text-slate-500 text-right">Min</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4">
                      {getProductHref ? (
                        <Link to={getProductHref(p.id)} className="text-accent hover:underline">
                          {p.productName}
                        </Link>
                      ) : (
                        p.productName
                      )}
                    </td>
                    <td className={`py-2 pr-4 text-right font-medium tabular-nums ${p.isBelowThreshold ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.stockLevel}
                      {p.isBelowThreshold && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="py-2 text-right text-slate-400 tabular-nums">{p.stockThreshold}</td>
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
