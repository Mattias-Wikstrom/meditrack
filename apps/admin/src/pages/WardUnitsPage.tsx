import { Link } from 'react-router-dom';
import { useQuery } from 'urql';
import { Card, Spinner } from '@meditrack/ui';
import { graphql } from '../gql';

const WARD_UNITS_QUERY = graphql(`
  query AdminWardUnits {
    wardUnits {
      id
      name
    }
  }
`);

export function WardUnitsPage() {
  const [{ data, fetching, error }] = useQuery({ query: WARD_UNITS_QUERY });

  if (fetching) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>;

  const units = data?.wardUnits ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 min-h-[38px]">
        <h1 className="text-xl font-semibold text-slate-800">
          Ward Units
          <span className="ml-2 text-sm font-normal text-slate-400">{units.length}</span>
        </h1>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">ID</th>
              <th className="px-4 py-3 font-medium text-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/ward-units/${unit.id}`} className="text-accent hover:underline">
                    {unit.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{unit.id}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/orders/${unit.id}`} className="text-slate-400 hover:text-accent text-xs">
                    Orders →
                  </Link>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-slate-400">No ward units found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
