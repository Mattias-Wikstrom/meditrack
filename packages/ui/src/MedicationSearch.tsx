import { useState, useEffect, useRef, useId } from 'react';

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
  const inputId = listboxId + '-input';

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

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label htmlFor={inputId} className="label">{label}</label>
      <div className="search">
        <span className="ico">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
        </span>
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
          className="input"
        />
        {loading && (
          <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true">
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          </span>
        )}
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        style={{ display: open ? undefined : 'none', position: 'absolute', zIndex: 20, top: 'calc(100% + 8px)', left: 0, right: 0 }}
        className="card"
      >
        {results.map((med, i) => (
          <li key={med.id} id={optionId(i)} role="option" aria-selected={i === activeIndex}>
            <button
              type="button"
              onMouseDown={() => handleSelect(med)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 14px',
                borderRadius: 9, cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                background: i === activeIndex ? 'var(--accent-soft)' : 'transparent',
                border: 'none', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
              onMouseLeave={e => i !== activeIndex && (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <span className="medname">{med.innName}</span> <span className="subtle">{med.strength}</span>
                <div className="minicode mono">{med.atcCode} · {med.form}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
