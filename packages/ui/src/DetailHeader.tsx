import { BackButton } from './BackButton';

export function DetailHeader({ onBack, children }: { onBack: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <BackButton onClick={onBack} />
      {children && <div className="ml-auto flex gap-2">{children}</div>}
    </div>
  );
}
