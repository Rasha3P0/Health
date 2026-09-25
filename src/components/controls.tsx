import { SCALE_ANCHORS, SCALE_VALUES } from '../content/fields';

// Big, calm tap targets. Tapping the selected value again clears it, so a
// mis-tap is never stuck. Nothing is ever required.

export function Scale(props: {
  id: string;
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const { id, label, hint, value, onChange } = props;
  return (
    <fieldset class="field">
      <legend>
        <span class="field-label">{label}</span>
        {hint && <span class="field-hint">{hint}</span>}
      </legend>
      <div class="scale" role="radiogroup" aria-label={label}>
        {SCALE_VALUES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}${n === 1 ? `, ${SCALE_ANCHORS.low}` : n === 5 ? `, ${SCALE_ANCHORS.high}` : ''}`}
            class={value === n ? 'on' : ''}
            onClick={() => onChange(value === n ? undefined : n)}
            id={n === 1 ? `${id}-1` : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <div class="anchors" aria-hidden="true">
        <span>{SCALE_ANCHORS.low}</span>
        <span>{SCALE_ANCHORS.high}</span>
      </div>
    </fieldset>
  );
}

export function SingleChoice(props: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const { label, hint, options, value, onChange } = props;
  return (
    <fieldset class="field">
      <legend>
        <span class="field-label">{label}</span>
        {hint && <span class="field-hint">{hint}</span>}
      </legend>
      <div class="chips" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            class={`chip${value === o.value ? ' on' : ''}`}
            onClick={() => onChange(value === o.value ? undefined : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
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
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value.includes(o.id)}
          class={`chip${value.includes(o.id) ? ' on' : ''}`}
          onClick={() => toggle(o.id)}
        >
          {value.includes(o.id) && <span aria-hidden="true">✓ </span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}
