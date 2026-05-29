// Used for the top tab navigation in all the apps
import { NavLink } from 'react-router-dom';

export interface TabNavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface TabNavProps {
  items: TabNavItem[];
}

export function TabNav({ items }: TabNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex gap-1">
      {items.map((item) => (
        <NavLink
          key={`${item.to}:${item.label}`}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
