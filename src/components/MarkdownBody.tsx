import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code';
import type { Pluggable } from 'unified';
import MermaidDiagram from '@/components/MermaidDiagram';

const prettyCodeOptions: PrettyCodeOptions = {
  theme: {
    light: 'catppuccin-latte',
    dark: 'catppuccin-mocha',
  },
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: 'plaintext',
  getHighlighter: async (options) => {
    const { createHighlighter } = await import('shiki');
    return createHighlighter({
      ...options,
      langAlias: {
        ...(options.langAlias ?? {}),
        sh: 'bash',
        shell: 'bash',
        yml: 'yaml',
        Dockerfile: 'dockerfile',
        text: 'plaintext',
        plain: 'plaintext',
        // No bundled RouterOS grammar; bash is a close-enough fallback for highlight.
        routeros: 'bash',
      },
    });
  },
};

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions] as Pluggable],
  },
};

function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

function isMermaidClass(className?: string): boolean {
  if (!className) return false;
  return className.split(/\s+/).includes('language-mermaid');
}

type PreProps = ComponentPropsWithoutRef<'pre'> & {
  'data-language'?: string;
};

function MarkdownPre({ children, ...props }: PreProps) {
  const language = props['data-language'];
  if (language === 'mermaid') {
    return <MermaidDiagram chart={extractText(children)} />;
  }

  const child = Children.toArray(children)[0];
  if (
    isValidElement<{ className?: string; children?: ReactNode; 'data-language'?: string }>(child) &&
    (isMermaidClass(child.props.className) || child.props['data-language'] === 'mermaid')
  ) {
    return <MermaidDiagram chart={extractText(child.props.children)} />;
  }

  return <pre {...props}>{children}</pre>;
}

const components = {
  pre: MarkdownPre,
};

/** Shared MDX renderer with GFM, Shiki highlighting, and Mermaid. */
export default function MarkdownBody({ source }: { source: string }) {
  return (
    <div className="prose">
      <MDXRemote source={source} options={mdxOptions} components={components} />
    </div>
  );
}
