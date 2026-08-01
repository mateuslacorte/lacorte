import type { SVGProps } from 'react';

export type IconName = 'archive' | 'arrow' | 'building' | 'check' | 'code' | 'document' | 'graph' | 'layers' | 'play' | 'research' | 'spark' | 'terminal';

const paths: Record<IconName, React.ReactNode> = {
  archive: <><path d="M4 7h16v13H4z" /><path d="M3 4h18v3H3zM9 11h6" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  building: <><path d="M4 21h16M6 21V5l6-3 6 3v16" /><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  code: <path d="m9 18-6-6 6-6m6 0 6 6-6 6m-2-14-2 16" />,
  document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
  graph: <><circle cx="5" cy="12" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="19" cy="18" r="2" /><path d="m7 11 9-5m-9 7 10 4M18 7l1 9" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
  play: <path d="m8 5 11 7-11 7z" />,
  research: <><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 5 5M8 7h4M8 10h4M8 13h2" /></>,
  spark: <><path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  terminal: <path d="m4 7 5 5-5 5m8 0h8" />,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}

