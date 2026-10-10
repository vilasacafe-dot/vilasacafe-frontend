import Spinner from './Spinner.jsx';

export default function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <Spinner className="h-8 w-8 text-brand-600" />
    </div>
  );
}
