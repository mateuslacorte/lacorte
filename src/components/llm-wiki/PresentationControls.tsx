'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';

interface Props {
  onReset: () => void;
}

const sections = [
  ['lab', 'Lab'],
  ['compare', 'Compare'],
  ['openwiki', 'OpenWiki'],
  ['okf', 'OKF'],
  ['start', 'Start'],
];

export function PresentationControls({ onReset }: Props) {
  const [presenting, setPresenting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const syncFullscreenState = () => setPresenting(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const nextIndex = sections.reduce((closest, [id], index) => {
        const element = document.getElementById(id);
        if (!element || element.offsetHeight === 0) return closest;
        return element.getBoundingClientRect().top <= window.innerHeight * 0.45 ? index : closest;
      }, 0);
      setActiveIndex(nextIndex);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  async function togglePresentation() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      setPresenting(false);
    }
  }

  return (
    <nav className="llmw-presentation-controls" aria-label="Learning journey controls" data-presenting={presenting}>
      <a className="llmw-mini-brand" href="#llm-wiki-top" aria-label="Back to LLM Wiki introduction"><Icon name="spark" /> LW</a>
      <div>
        {sections.map(([id, label], index) => <a key={id} href={`#${id}`} aria-current={index === activeIndex ? 'step' : undefined} onClick={() => setActiveIndex(index)}>{label}</a>)}
      </div>
      <button type="button" onClick={onReset}>Reset lab</button>
      <button type="button" onClick={togglePresentation} aria-pressed={presenting}><Icon name="play" /> Present</button>
      <span className="llmw-journey-progress" role="progressbar" aria-label="Learning journey progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((activeIndex + 1) / sections.length) * 100)}>
        <i style={{ width: `${((activeIndex + 1) / sections.length) * 100}%` }} />
      </span>
    </nav>
  );
}
