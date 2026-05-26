import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'urql';
import { MedicationDetail, Spinner } from '@meditrack/ui';

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

export function MedicationDetailPage() {
  const navigate = useNavigate();
  const { medicationId } = useParams();

  const [{ data, fetching, error }] = useQuery({
    query: MEDICATION_DETAIL_QUERY,
    variables: { id: medicationId },
  });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const medication = data?.medication;
  if (!medication) return (
    <p className="text-sm text-slate-500">
      Medication not found.{' '}
      <a className="text-accent hover:underline" href="/inventory">Back to inventory</a>.
    </p>
  );

  return (
    <MedicationDetail
      medication={medication}
      products={data?.medicinalProducts ?? []}
      onBack={() => navigate('/inventory')}
      getProductHref={id => `/inventory/${id}`}
    />
  );
}
