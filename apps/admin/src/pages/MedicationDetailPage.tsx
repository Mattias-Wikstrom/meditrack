import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { Button, Card, Spinner, InfoRow } from '@meditrack/ui';
import { useAuth, createApiClient } from '@meditrack/client';
import { graphql } from '../gql';

const MEDICATION_DETAIL_QUERY = graphql(`
  query AdminMedicationDetail($id: ID!) {
    medication(id: $id) {
      id innName atcCode form strength
    }
    medicinalProducts(medicationId: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`);

const FORMS = ['Tablet', 'Capsule', 'Injection', 'Solution', 'Cream', 'Drops', 'Inhaler'] as const;

type Product = { id: string; productName: string; stockLevel: number; stockThreshold: number; isBelowThreshold: boolean };

type ModalState =
  | null
  | { type: 'editMedication' }
  | { type: 'confirmDeleteMedication' }
  | { type: 'addProduct' }
  | { type: 'editProduct'; product: Product }
  | { type: 'confirmDeleteProduct'; product: Product };

export function MedicationDetailPage() {
  const navigate = useNavigate();
  const { medicationId } = useParams();
  const { token } = useAuth();
  const [modal, setModal] = useState<ModalState>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [{ data, fetching, error }, refetch] = useQuery({
    query: MEDICATION_DETAIL_QUERY,
    variables: { id: medicationId },
  });

  if (fetching) return <Spinner />;
  if (error) return <p className="error-text">Error: {error.message}</p>;

  const medication = data?.medication;
  if (!medication) return (
    <p className="subtle">Medication not found. <button className="linkbtn" onClick={() => navigate('/inventory')}>Back to inventory</button></p>
  );

  const products: Product[] = data?.medicinalProducts ?? [];

  function closeModal() { setModal(null); setFormError(null); }

  async function handleUpdateMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).patch(`/medications/${medicationId}`, {
        innName: fd.get('innName') as string, atcCode: fd.get('atcCode') as string,
        form: fd.get('form') as string, strength: fd.get('strength') as string,
      });
      closeModal(); refetch({ requestPolicy: 'network-only' });
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to update medication'); }
  }

  async function handleDeleteMedication() {
    try {
      await createApiClient(token!).del(`/medications/${medicationId}`);
      navigate('/inventory');
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to delete medication'); }
  }

  async function handleCreateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).post(`/medications/${medicationId}/products`, {
        productName: fd.get('productName') as string,
        stockLevel: parseInt(fd.get('stockLevel') as string),
        stockThreshold: parseInt(fd.get('stockThreshold') as string),
      });
      closeModal(); refetch({ requestPolicy: 'network-only' });
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to add product'); }
  }

  async function handleUpdateProduct(e: React.FormEvent<HTMLFormElement>, productId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createApiClient(token!).patch(`/products/${productId}`, {
        productName: fd.get('productName') as string,
        stockThreshold: parseInt(fd.get('stockThreshold') as string),
      });
      closeModal(); refetch({ requestPolicy: 'network-only' });
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to update product'); }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await createApiClient(token!).del(`/products/${productId}`);
      closeModal(); refetch({ requestPolicy: 'network-only' });
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to delete product'); }
  }

  return (
    <div className="stack">
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="backlink" onClick={() => navigate('/inventory')} style={{ marginBottom: 0 }}>← Inventory</button>
        <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setModal({ type: 'editMedication' }); }}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { setFormError(null); setModal({ type: 'confirmDeleteMedication' }); }}>Delete</Button>
        </div>
      </div>

      <div>
        <h1 className="h1">{medication.innName}</h1>
        <div className="subtle mono" style={{ marginTop: 4, fontSize: 12.5 }}>{medication.atcCode}</div>
      </div>

      <div className="grid-2">
        <Card className="card-pad">
          <h2 className="h2" style={{ marginBottom: 16 }}>Details</h2>
          <InfoRow label="INN Name">{medication.innName}</InfoRow>
          <InfoRow label="ATC Code"><span className="mono" style={{ fontSize: 13 }}>{medication.atcCode}</span></InfoRow>
          <InfoRow label="Form">{medication.form}</InfoRow>
          <InfoRow label="Strength"><span className="mono" style={{ fontSize: 13 }}>{medication.strength}</span></InfoRow>
        </Card>

        <Card className="card-pad">
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 className="h2">Products <span style={{ color: 'var(--faint)', fontWeight: 500, fontSize: 14, marginLeft: 6 }}>{products.length}</span></h2>
            <div style={{ marginLeft: 'auto' }}>
              <Button size="sm" onClick={() => { setFormError(null); setModal({ type: 'addProduct' }); }}>+ Add Product</Button>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="empty" style={{ padding: '20px 0' }}>No products registered.</div>
          ) : (
            <table className="tbl">
              <thead><tr>
                <th className="no-sort">Product</th>
                <th className="no-sort num">Stock</th>
                <th className="no-sort num">Min</th>
                <th className="no-sort ar" />
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/inventory/${p.id}`} className="link-cell">{p.productName}</Link></td>
                    <td className={`num ${p.isBelowThreshold ? 'stock-low' : 'stock-ok'}`}>
                      {p.stockLevel}{p.isBelowThreshold && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                    </td>
                    <td className="num" style={{ color: 'var(--muted)' }}>{p.stockThreshold}</td>
                    <td className="ar">
                      <button className="linkbtn" style={{ fontSize: 13, marginRight: 10 }}
                        onClick={() => { setFormError(null); setModal({ type: 'editProduct', product: p }); }}>Edit</button>
                      <button className="linkbtn danger" style={{ fontSize: 13 }}
                        onClick={() => { setFormError(null); setModal({ type: 'confirmDeleteProduct', product: p }); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {modal?.type === 'editMedication' && (
        <div className="scrim" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Edit Medication</h3>
            <form onSubmit={handleUpdateMedication}>
              <div className="field"><label className="label">INN Name</label><input name="innName" defaultValue={medication.innName} required className="input" /></div>
              <div className="field"><label className="label">ATC Code</label><input name="atcCode" defaultValue={medication.atcCode} required className="input" /></div>
              <div className="field"><label className="label">Form</label>
                <select name="form" defaultValue={medication.form} className="select">{FORMS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="field"><label className="label">Strength</label><input name="strength" defaultValue={medication.strength} required className="input" /></div>
              {formError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{formError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === 'confirmDeleteMedication' && (
        <div className="scrim" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Delete Medication</h3>
            <div className="msub">Delete <strong>{medication.innName}</strong>? This cannot be undone. All products must be removed first.</div>
            {formError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{formError}</p>}
            <div className="modal-actions">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteMedication}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'addProduct' && (
        <div className="scrim" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Add Product</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="field"><label className="label">Product Name</label><input name="productName" required placeholder="e.g. Alvedon 500 mg" className="input" /></div>
              <div className="field"><label className="label">Initial Stock</label><input name="stockLevel" type="number" min={0} defaultValue={0} required className="input" /></div>
              <div className="field"><label className="label">Minimum Threshold</label><input name="stockThreshold" type="number" min={0} defaultValue={50} required className="input" /></div>
              {formError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{formError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit">Add Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === 'editProduct' && (
        <div className="scrim" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Edit Product</h3>
            <form onSubmit={(e) => handleUpdateProduct(e, modal.product.id)}>
              <div className="field"><label className="label">Product Name</label><input name="productName" defaultValue={modal.product.productName} required className="input" /></div>
              <div className="field"><label className="label">Minimum Threshold</label><input name="stockThreshold" type="number" min={0} defaultValue={modal.product.stockThreshold} required className="input" /></div>
              {formError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{formError}</p>}
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === 'confirmDeleteProduct' && (
        <div className="scrim" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <div className="msub">Delete <strong>{modal.product.productName}</strong>? This cannot be undone.</div>
            {formError && <p role="alert" className="error-text" style={{ marginBottom: 12 }}>{formError}</p>}
            <div className="modal-actions">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteProduct(modal.product.id)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
