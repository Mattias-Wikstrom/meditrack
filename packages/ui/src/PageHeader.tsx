import { BackButton } from './BackButton';

export function PageHeader({ onBack, children, actions, className }: {
  onBack: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 mb-4${className ? ` ${className}` : ''}`}>
      <BackButton onClick={onBack} />
      {children}
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </div>
  );
}
