// Used in /orders/new (nurse) to search and add medications to an order
import { useState, useEffect, useRef } from 'react';
import { Spinner } from './Spinner';

export interface MedicationOption {
  id: string;
  innName: string;
  atcCode: string;
  form: string;
  strength: string;
}

interface MedicationSearchProps {
  onSelect: (medication: MedicationOption) => void;
  placeholder?: string;
  fetcher: (query: string) => Promise<MedicationOption[]>;
}

export function MedicationSearch({ onSelect, placeholder = 'Search medications…', fetcher }: MedicationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await fetcher(query);
        setResults(hits);
        setOpen(hits.length > 0);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetcher]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(med: MedicationOption) {
    onSelect(med);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
        />
        {loading && <Spinner className="absolute right-3 top-2.5 h-4 w-4" />}
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
          {results.map((med) => (
            <li key={med.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(med)}
                className="w-full text-left px-4 py-3 hover:bg-accent-light transition-colors"
              >
                <p className="text-sm font-medium text-slate-800">{med.innName} <span className="text-slate-400 font-normal">{med.strength}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">{med.atcCode} · {med.form}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
