// Small line icons, drawn to match: 24px grid, 1.8 stroke, round caps.

type P = { size?: number; class?: string };

function Svg({ size = 24, class: cls, children }: P & { children: preact.ComponentChildren }) {
  return (
    <svg class={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const SunIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Svg>
);

export const CalendarIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <circle cx="15.5" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const EnvelopeIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.5 7 8.5 6.5L20.5 7" />
  </Svg>
);

export const OpenEnvelopeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5V18a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18z" />
    <path d="m3.5 11 8.5 6 8.5-6" />
  </Svg>
);

export const MoreIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" />
  </Svg>
);

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const BackIcon = (p: P) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const ChevronIcon = (p: P) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const ShareIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v12M8 7l4-4 4 4M8 10H6v10h12V10h-2" />
  </Svg>
);

export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);
