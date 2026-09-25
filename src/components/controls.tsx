import { CheckIcon } from './icons';

// Big, calm tap targets. Tapping the selected option again clears it, so a
// mis-tap is never stuck. Nothing is ever required.

/** One choice from a vertical list. `level` draws a 1–5 fill meter beside each option. */
export function OptionStack(props: {
  label: string;
  options: { value: string; label: string; level?: number }[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const { label, options, value, onChange } = props;
  return (
    <div class="options" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            class={`option${on ? ' on' : ''}`}
            onClick={() => onChange(on ? undefined : o.value)}
          >
            {o.level !== undefined && <Meter level={o.level} />}
            <span class="option-label">{o.label}</span>
            <span class="option-tick" aria-hidden="true">{on && <CheckIcon size={20} />}</span>
          </button>
        );
      })}
    </div>
  );
}

function Meter({ level }: { level: number }) {
  return (
    <span class="meter" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} class={i <= level ? 'lit' : ''} />
      ))}
    </span>
  );
}

export function MultiChoice(props: {
  label?: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  stacked?: boolean;
}) {
  const { label, options, value, onChange, stacked } = props;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div class={`chips${stacked ? ' stacked' : ''}`} role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" aria-pressed={on} class={`chip${on ? ' on' : ''}`} onClick={() => toggle(o.id)}>
            {stacked && <span class="box" aria-hidden="true">{on && <CheckIcon size={16} />}</span>}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
