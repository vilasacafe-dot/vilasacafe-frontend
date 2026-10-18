import Spinner from './Spinner.jsx';

/**
 * Accessible on/off switch.
 *
 * - Renders a real <button role="switch"> with aria-checked, so it works with
 *   keyboard (Space/Enter) and screen readers.
 * - `label` is the accessible name and MUST identify what is controlled,
 *   e.g. "Mark Paneer Roll as available".
 * - While `busy`, the control is disabled and shows a spinner so repeated
 *   conflicting requests are prevented.
 *
 * Colour is never the only signal — callers pair this with status text.
 */
export default function Switch({ checked, onChange, busy = false, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={() => onChange?.(!checked)}
      className={`switch ${checked ? 'switch-on' : 'switch-off'}`}
    >
      <span className="switch-knob">
        {busy && (
          <span className="flex h-full w-full items-center justify-center">
            <Spinner className="h-3 w-3 text-stone" />
          </span>
        )}
      </span>
    </button>
  );
}
