import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '@/components/MermaidDiagram';

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
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

function isMermaidCode(className?: string): boolean {
  if (!className) return false;
  return className.split(/\s+/).includes('language-mermaid');
}

function MarkdownPre({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const child = Children.toArray(children)[0];

  if (
    isValidElement<{ className?: string; children?: ReactNode }>(child) &&
    isMermaidCode(child.props.className)
  ) {
    return <MermaidDiagram chart={extractText(child.props.children)} />;
  }

  return <pre {...props}>{children}</pre>;
}

const components = {
  pre: MarkdownPre,
};

/** Shared MDX renderer with GFM (tables, strikethrough, autolinks) + Mermaid. */
export default function MarkdownBody({ source }: { source: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <MDXRemote source={source} options={mdxOptions} components={components} />
    </div>
  );
}
