'use client';

import { useEffect, useId, useRef, useState } from 'react';

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/** Client-side Mermaid renderer for fenced ```mermaid blocks in Markdown/MDX. */
export default function MermaidDiagram({ chart }: { chart: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkMode());
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const source = chart.replace(/\r\n/g, '\n').trim();
    if (!source) return;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'default',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        });

        const renderId = `mermaid-${rawId}-${dark ? 'd' : 'l'}`;
        const { svg } = await mermaid.render(renderId, source);
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        if (hostRef.current) hostRef.current.innerHTML = '';
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, dark, rawId]);

  if (error) {
    return (
      <div className="not-prose my-8 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
          Mermaid diagram error
        </p>
        <pre className="overflow-x-auto text-xs text-[var(--color-text-muted)] whitespace-pre-wrap">
          {chart.trim()}
        </pre>
      </div>
    );
  }

  return (
    <div className="not-prose my-8 flex justify-center overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
      <div ref={hostRef} className="mermaid-diagram w-full max-w-full [&_svg]:mx-auto [&_svg]:max-w-full" />
    </div>
  );
}
