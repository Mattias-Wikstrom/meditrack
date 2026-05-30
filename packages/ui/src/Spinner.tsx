export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className="spinner-wrap">
      <span className={`spinner spinner-lg${className ? ' ' + className : ''}`} role="status" aria-label="Loading" />
    </div>
  );
}
