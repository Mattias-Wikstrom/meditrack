// Used in /orders/new (nurse) to search and add medications to an order
import { useState, useEffect, useRef, useId } from 'react';
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
  label?: string;
  placeholder?: string;
  fetcher: (query: string) => Promise<MedicationOption[]>;
}

export function MedicationSearch({ onSelect, label = 'Search medications', placeholder = 'Search medications…', fetcher }: MedicationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); setActiveIndex(-1); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await fetcher(query);
        setResults(hits);
        setOpen(hits.length > 0);
        setActiveIndex(-1);
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
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const optionId = (i: number) => `${listboxId}-option-${i}`;

  const inputId = listboxId + '-input';

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
        />
        {loading && <Spinner className="absolute right-3 top-2.5 h-4 w-4" aria-hidden="true" />}
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        className={`absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden ${open ? '' : 'hidden'}`}
      >
        {results.map((med, i) => (
          <li
            key={med.id}
            id={optionId(i)}
            role="option"
            aria-selected={i === activeIndex}
          >
            <button
              type="button"
              onMouseDown={() => handleSelect(med)}
              className={`w-full text-left px-4 py-3 transition-colors ${i === activeIndex ? 'bg-accent-light' : 'hover:bg-accent-light'}`}
            >
              <p className="text-sm font-medium text-slate-800">{med.innName} <span className="text-slate-400 font-normal">{med.strength}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">{med.atcCode} · {med.form}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
