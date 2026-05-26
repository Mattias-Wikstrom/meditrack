import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'urql';
import { Button, Card, DetailHeader, Spinner, InfoRow } from '@meditrack/ui';

const MEDICATION_DETAIL_QUERY = `
  query AdminMedicationDetail($id: ID!) {
    medication(id: $id) {
      id innName atcCode form strength
    }
    medicinalProducts(medicationId: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`;

const UPDATE_MEDICATION = `
  mutation AdminUpdateMedication($id: ID!, $innName: String, $atcCode: String, $form: MedicationForm, $strength: String) {
    updateMedication(id: $id, innName: $innName, atcCode: $atcCode, form: $form, strength: $strength) {
      id innName atcCode form strength
    }
  }
`;

const DELETE_MEDICATION = `
  mutation AdminDeleteMedication($id: ID!) {
    deleteMedication(id: $id)
  }
`;

const CREATE_PRODUCT = `
  mutation AdminCreateProduct($productName: String!, $medicationId: ID!, $stockLevel: Int!, $stockThreshold: Int!) {
    createMedicinalProduct(productName: $productName, medicationId: $medicationId, stockLevel: $stockLevel, stockThreshold: $stockThreshold) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`;

const UPDATE_PRODUCT = `
  mutation AdminUpdateProduct($id: ID!, $productName: String, $stockThreshold: Int) {
    updateMedicinalProduct(id: $id, productName: $productName, stockThreshold: $stockThreshold) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`;

const DELETE_PRODUCT = `
  mutation AdminDeleteProduct($id: ID!) {
    deleteMedicinalProduct(id: $id)
  }
`;

const FORMS = ['Tablet', 'Capsule', 'Injection', 'Solution', 'Cream', 'Drops', 'Inhaler'] as const;

type Product = { id: string; productName: string; stockLevel: number; stockThreshold: number; isBelowThreshold: boolean };

type ModalState =
  | null
  | { type: 'editMedication' }
  | { type: 'confirmDeleteMedication' }
  | { type: 'addProduct' }
  | { type: 'editProduct'; product: Product }
  | { type: 'confirmDeleteProduct'; product: Product };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function MedicationDetailPage() {
  const navigate = useNavigate();
  const { medicationId } = useParams();
  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: MEDICATION_DETAIL_QUERY,
    variables: { id: medicationId },
  });

  const [, updateMedication] = useMutation(UPDATE_MEDICATION);
  const [, deleteMedication] = useMutation(DELETE_MEDICATION);
  const [, createProduct] = useMutation(CREATE_PRODUCT);
  const [, updateProduct] = useMutation(UPDATE_PRODUCT);
  const [, deleteProduct] = useMutation(DELETE_PRODUCT);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const medication = data?.medication;
  if (!medication) return (
    <p className="text-sm text-slate-500">
      Medication not found.{' '}
      <a className="text-accent hover:underline" href="/inventory">Back to inventory</a>.
    </p>
  );

  const products: Product[] = data?.medicinalProducts ?? [];

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleUpdateMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await updateMedication({
      id: medicationId,
      innName: fd.get('innName') as string,
      atcCode: fd.get('atcCode') as string,
      form: fd.get('form') as string,
      strength: fd.get('strength') as string,
    });
    if (result.error) { setFormError(result.error.message); return; }
    closeModal();
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleDeleteMedication() {
    const result = await deleteMedication({ id: medicationId });
    if (result.error) { setFormError(result.error.message); return; }
    navigate('/inventory');
  }

  async function handleCreateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await createProduct({
      productName: fd.get('productName') as string,
      medicationId,
      stockLevel: parseInt(fd.get('stockLevel') as string),
      stockThreshold: parseInt(fd.get('stockThreshold') as string),
    });
    if (result.error) { setFormError(result.error.message); return; }
    closeModal();
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleUpdateProduct(e: React.FormEvent<HTMLFormElement>, productId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await updateProduct({
      id: productId,
      productName: fd.get('productName') as string,
      stockThreshold: parseInt(fd.get('stockThreshold') as string),
    });
    if (result.error) { setFormError(result.error.message); return; }
    closeModal();
    refetch({ requestPolicy: 'network-only' });
  }

  async function handleDeleteProduct(productId: string) {
    const result = await deleteProduct({ id: productId });
    if (result.error) { setFormError(result.error.message); return; }
    closeModal();
    refetch({ requestPolicy: 'network-only' });
  }

  return (
    <div>
      <DetailHeader onBack={() => navigate('/inventory')}>
        <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setModal({ type: 'editMedication' }); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => { setFormError(null); setModal({ type: 'confirmDeleteMedication' }); }}>Delete</Button>
      </DetailHeader>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">{medication.innName}</h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{medication.atcCode}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Details</h2>
          <InfoRow label="INN Name">{medication.innName}</InfoRow>
          <InfoRow label="ATC Code"><span className="font-mono text-xs">{medication.atcCode}</span></InfoRow>
          <InfoRow label="Form">{medication.form}</InfoRow>
          <InfoRow label="Strength"><span className="font-mono text-xs">{medication.strength}</span></InfoRow>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">
              Products <span className="ml-1 text-sm font-normal text-slate-400">{products.length}</span>
            </h2>
            <Button size="sm" onClick={() => { setFormError(null); setModal({ type: 'addProduct' }); }}>
              + Add Product
            </Button>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400">No products registered.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-medium text-slate-500">Product</th>
                  <th className="pb-2 font-medium text-slate-500 text-right">Stock</th>
                  <th className="pb-2 font-medium text-slate-500 text-right">Min</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-2">
                      <Link to={`/inventory/${p.id}`} className="text-accent hover:underline">{p.productName}</Link>
                    </td>
                    <td className={`py-2 pr-2 text-right tabular-nums font-medium ${p.isBelowThreshold ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.stockLevel}{p.isBelowThreshold && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="py-2 pr-2 text-right text-slate-400 tabular-nums">{p.stockThreshold}</td>
                    <td className="py-2 text-right">
                      <button
                        className="text-xs text-slate-400 hover:text-accent mr-2 transition-colors"
                        onClick={() => { setFormError(null); setModal({ type: 'editProduct', product: p }); }}
                      >Edit</button>
                      <button
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        onClick={() => { setFormError(null); setModal({ type: 'confirmDeleteProduct', product: p }); }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {modal?.type === 'editMedication' && (
        <DialogShell title="Edit Medication" onClose={closeModal}>
          <form onSubmit={handleUpdateMedication} className="space-y-3">
            <Field label="INN Name">
              <input name="innName" defaultValue={medication.innName} required className={inputCls} />
            </Field>
            <Field label="ATC Code">
              <input name="atcCode" defaultValue={medication.atcCode} required className={inputCls} />
            </Field>
            <Field label="Form">
              <select name="form" defaultValue={medication.form} className={inputCls}>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Strength">
              <input name="strength" defaultValue={medication.strength} required className={inputCls} />
            </Field>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogShell>
      )}

      {modal?.type === 'confirmDeleteMedication' && (
        <DialogShell title="Delete Medication" onClose={closeModal}>
          <p className="text-sm text-slate-600 mb-4">
            Delete <strong>{medication.innName}</strong>? This cannot be undone. All products must be removed first.
          </p>
          {formError && <p className="text-xs text-red-600 mb-3">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteMedication}>Delete</Button>
          </div>
        </DialogShell>
      )}

      {modal?.type === 'addProduct' && (
        <DialogShell title="Add Product" onClose={closeModal}>
          <form onSubmit={handleCreateProduct} className="space-y-3">
            <Field label="Product Name">
              <input name="productName" required placeholder="e.g. Alvedon 500 mg" className={inputCls} />
            </Field>
            <Field label="Initial Stock">
              <input name="stockLevel" type="number" min={0} defaultValue={0} required className={inputCls} />
            </Field>
            <Field label="Minimum Threshold">
              <input name="stockThreshold" type="number" min={0} defaultValue={50} required className={inputCls} />
            </Field>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button type="submit">Add Product</Button>
            </div>
          </form>
        </DialogShell>
      )}

      {modal?.type === 'editProduct' && (
        <DialogShell title="Edit Product" onClose={closeModal}>
          <form onSubmit={(e) => handleUpdateProduct(e, modal.product.id)} className="space-y-3">
            <Field label="Product Name">
              <input name="productName" defaultValue={modal.product.productName} required className={inputCls} />
            </Field>
            <Field label="Minimum Threshold">
              <input name="stockThreshold" type="number" min={0} defaultValue={modal.product.stockThreshold} required className={inputCls} />
            </Field>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogShell>
      )}

      {modal?.type === 'confirmDeleteProduct' && (
        <DialogShell title="Delete Product" onClose={closeModal}>
          <p className="text-sm text-slate-600 mb-4">
            Delete <strong>{modal.product.productName}</strong>? This cannot be undone.
          </p>
          {formError && <p className="text-xs text-red-600 mb-3">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDeleteProduct(modal.product.id)}>Delete</Button>
          </div>
        </DialogShell>
      )}
    </div>
  );
}
