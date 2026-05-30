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
    <nav aria-label="Main navigation" style={{ display: 'contents' }}>
      {items.map((item) => (
        <NavLink
          key={`${item.to}:${item.label}`}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tab${isActive ? ' on' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
