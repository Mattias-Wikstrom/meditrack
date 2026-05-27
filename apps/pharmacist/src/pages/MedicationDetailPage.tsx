// Used for /medications/:medicationId (pharmacist)
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useSubscription } from 'urql';
import { MedicationDetail, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const MEDICATION_DETAIL_QUERY = graphql(`
  query PharmacistMedicationDetail($id: ID!) {
    medication(id: $id) {
      id innName atcCode form strength
    }
    medicinalProducts(medicationId: $id) {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`);

const PRODUCT_UPDATED_SUB = graphql(`
  subscription PharmacistMedicationDetailProductUpdated {
    medicinalProductUpdated {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`);

export function MedicationDetailPage() {
  const navigate = useNavigate();
  const { medicationId } = useParams();

  const [{ data, fetching, error }] = useQuery({
    query: MEDICATION_DETAIL_QUERY,
    variables: { id: medicationId! },
  });

  const [{ data: subData }] = useSubscription({ query: PRODUCT_UPDATED_SUB });
  const productUpdate = subData?.medicinalProductUpdated;
  const [overrides, setOverrides] = useState<Map<string, NonNullable<typeof productUpdate>>>(new Map());

  useEffect(() => {
    if (!productUpdate) return;
    setOverrides(prev => new Map(prev).set(productUpdate.id, productUpdate));
  }, [productUpdate]);

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const medication = data?.medication;
  if (!medication) return (
    <p className="text-sm text-slate-500">
      Medication not found.{' '}
      <a className="text-accent hover:underline" href="/inventory">Back to inventory</a>.
    </p>
  );

  const products = (data?.medicinalProducts ?? []).map(p => overrides.get(p.id) ?? p);

  return (
    <MedicationDetail
      medication={medication}
      products={products}
      onBack={() => navigate('/inventory')}
      getProductHref={id => `/inventory/${id}`}
    />
  );
}
