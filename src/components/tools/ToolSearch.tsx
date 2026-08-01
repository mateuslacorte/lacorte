'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface Tool {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  keywords: string[];
}

const tools: Tool[] = [
  // Generators
  { slug: 'qr-code', title: 'QR Code Generator', description: 'Convert URLs or text into QR codes', icon: '📱', category: 'generators', keywords: ['qr', 'qrcode'] },
  { slug: 'password', title: 'Password Generator', description: 'Generate secure passwords', icon: '🔐', category: 'generators', keywords: ['password'] },
  { slug: 'uuid', title: 'UUID Generator', description: 'Generate UUID v4 values', icon: '🔑', category: 'generators', keywords: ['uuid', 'guid'] },
  { slug: 'lorem-ipsum', title: 'Lorem Ipsum Generator', description: 'Generate dummy text', icon: '📝', category: 'generators', keywords: ['lorem', 'ipsum', 'dummy'] },
  { slug: 'color-palette', title: 'Color Palette Generator', description: 'Generate harmonious color palettes', icon: '🎨', category: 'generators', keywords: ['color', 'palette'] },
  { slug: 'hash', title: 'Hash Generator', description: 'Generate MD5, SHA-1, and SHA-256 hashes', icon: '#️⃣', category: 'generators', keywords: ['hash', 'md5', 'sha'] },
  // Converters
  { slug: 'color', title: 'Color Converter', description: 'Convert HEX, RGB, and HSL colors', icon: '🌈', category: 'converters', keywords: ['color', 'hex', 'rgb', 'hsl'] },
  { slug: 'unit', title: 'Unit Converter', description: 'Convert length, weight, and temperature units', icon: '📏', category: 'converters', keywords: ['unit', 'length', 'weight', 'temperature', 'cm', 'inch', 'kg', 'lb'] },
  { slug: 'base64', title: 'Base64 Encoder/Decoder', description: 'Encode and decode text with Base64', icon: '🔄', category: 'converters', keywords: ['base64', 'encode', 'decode'] },
  { slug: 'image-converter', title: 'Image Format Converter', description: 'Convert between JPEG, PNG, and WebP formats', icon: '🖼️', category: 'image', keywords: ['image', 'convert', 'jpeg', 'png', 'webp'] },
  // Text
  { slug: 'text-counter', title: 'Text Counter', description: 'Count characters, words, and lines', icon: '🔢', category: 'text', keywords: ['text', 'count', 'character', 'word'] },
  { slug: 'markdown', title: 'Markdown Preview', description: 'Live markdown preview', icon: '📄', category: 'text', keywords: ['markdown', 'md', 'preview'] },
  { slug: 'diff', title: 'Text Diff Tool', description: 'Compare differences between two texts', icon: '📊', category: 'developer', keywords: ['diff', 'compare', 'text'] },
  // Developer
  { slug: 'json', title: 'JSON Formatter', description: 'Format and validate JSON', icon: '{ }', category: 'developer', keywords: ['json', 'format', 'beautify', 'validate'] },
  { slug: 'regex', title: 'Regex Tester', description: 'Test regular expressions and inspect matches', icon: '🔍', category: 'developer', keywords: ['regex', 'regular expression'] },
  { slug: 'url-encoder', title: 'URL Encoder/Decoder', description: 'Encode and decode URL strings', icon: '🔗', category: 'developer', keywords: ['url', 'encode', 'decode', 'percent'] },
  { slug: 'jwt-decoder', title: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: '🎫', category: 'developer', keywords: ['jwt', 'token', 'decode'] },
  { slug: 'cron', title: 'Cron Expression Generator', description: 'Generate and explain cron expressions', icon: '⏰', category: 'developer', keywords: ['cron', 'schedule', 'expression'] },
  // Designer
  { slug: 'gradient', title: 'CSS Gradient Generator', description: 'Visually create CSS gradients', icon: '🌈', category: 'designer', keywords: ['css', 'gradient'] },
  { slug: 'box-shadow', title: 'CSS Box Shadow Generator', description: 'Visually create CSS box-shadow values', icon: '🎭', category: 'designer', keywords: ['css', 'shadow', 'box-shadow'] },
  // Photographer
  { slug: 'image-resizer', title: 'Image Resizer', description: 'Live crop plus preset resizing', icon: '📐', category: 'image', keywords: ['image', 'resize', 'compress', 'crop', 'preset', 'slack', 'iphone', 'thumbnail'] },
  { slug: 'exif', title: 'EXIF Viewer', description: 'Inspect photo EXIF metadata', icon: '📷', category: 'image', keywords: ['exif', 'metadata', 'photo'] },
  // Marketer
  { slug: 'utm', title: 'UTM Link Builder', description: 'Build UTM links for campaign tracking', icon: '📊', category: 'marketer', keywords: ['utm', 'campaign', 'tracking'] },
  // Productivity
  { slug: 'timer', title: 'Timer / Stopwatch', description: 'Timer and stopwatch in one tool', icon: '⏱️', category: 'productivity', keywords: ['timer', 'stopwatch'] },
  { slug: 'pomodoro', title: 'Pomodoro Timer', description: 'Boost productivity with the Pomodoro technique', icon: '🍅', category: 'productivity', keywords: ['pomodoro'] },
  { slug: 'world-clock', title: 'World Clock', description: 'Check and convert time zones worldwide', icon: '🌍', category: 'productivity', keywords: ['world', 'clock', 'timezone'] },
];

export default function ToolSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredTools = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return tools.filter(tool =>
      tool.title.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTools]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredTools.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredTools.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          window.location.href = `/tools/${filteredTools[selectedIndex].slug}`;
        }
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools... (⌘K)"
          className="w-full pl-10 pr-4 py-3 rounded-xl
            bg-[var(--color-card)] border border-[var(--color-border)]
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
            outline-none transition-all
            text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
        <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2
          items-center gap-1 px-2 py-1 rounded
          bg-[var(--color-card-hover)] text-[var(--color-text-muted)]
          text-xs font-mono border border-[var(--color-border)]"
        >
          ⌘K
        </kbd>
      </div>

      {isOpen && filteredTools.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 py-2 rounded-xl
            bg-[var(--color-card)] border border-[var(--color-border)]
            shadow-xl max-h-96 overflow-auto"
        >
          {filteredTools.map((tool, index) => (
            <a
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors
                ${index === selectedIndex
                  ? 'bg-primary-500/10 text-primary-500'
                  : 'hover:bg-[var(--color-card-hover)]'
                }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-xl">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.title}</div>
                <div className="text-sm text-[var(--color-text-muted)] truncate">
                  {tool.description}
                </div>
              </div>
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {isOpen && query && filteredTools.length === 0 && (
        <div className="absolute z-50 w-full mt-2 py-8 rounded-xl
          bg-[var(--color-card)] border border-[var(--color-border)]
          shadow-xl text-center text-[var(--color-text-muted)]"
        >
          <p>No results found</p>
          <p className="text-sm mt-1">Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
}
