import { BackButton } from './BackButton';

export function PageHeader({ onBack, children, actions, className }: {
  onBack: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`row${className ? ' ' + className : ''}`} style={{ marginBottom: children || actions ? 8 : 0 }}>
      <BackButton onClick={onBack} style={{ marginBottom: 0 }} />
      {children && <div className="row" style={{ gap: 12, flex: 1 }}>{children}</div>}
      {actions && <div className="row" style={{ marginLeft: 'auto', gap: 8 }}>{actions}</div>}
    </div>
  );
}
