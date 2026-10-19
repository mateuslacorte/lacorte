import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import ToolPageClient from '@/components/tools/ToolPageClient';
import { getToolBySlug, toolsConfig } from '@/data/tools';
import { getToolComponent } from '@/components/tools/registry';
import { parseLocale, t } from '@/i18n';
import { commonTranslations } from '@/i18n/translations/common';
import { breadcrumbJsonLd, faqJsonLd, webApplicationJsonLd } from '@/lib/jsonLd';
import { localeAlternates, localeOpenGraph } from '@/lib/localeMetadata';

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return toolsConfig.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const seo = tool.seo[lang];
  const urlPath = `/tools/${slug}`;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: localeAlternates(urlPath, lang),
    openGraph: localeOpenGraph(lang, {
      title: seo.title,
      description: seo.description,
      urlPath,
    }),
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { locale, slug } = await params;
  const lang = parseLocale(locale);
  const tool = getToolBySlug(slug);

  if (!tool || !getToolComponent(slug)) {
    notFound();
  }

  const seo = tool.seo[lang];
  const nav = commonTranslations.nav;

  const pdfEditorFeatures =
    slug === 'pdf-editor'
      ? lang === 'pt'
        ? [
            '100% grátis e sem login ou cadastro',
            'Editar textos e fontes do PDF diretamente no navegador',
            'Juntar e combinar múltiplos arquivos PDF gratuitamente',
            'Excluir e reordenar páginas do PDF',
            'Inserir imagens e desenhar assinaturas digitais',
            'Exportar PDF grátis sem marca d\'água',
          ]
        : [
            '100% free with no login or signup required',
            'Edit PDF text and fonts in-place directly in your browser',
            'Merge and combine multiple PDF files for free',
            'Delete and reorder PDF pages easily',
            'Insert images and draw digital signatures',
            'Export modified PDF for free with no watermarks',
          ]
      : undefined;

  const structuredData: Record<string, unknown>[] = [
    webApplicationJsonLd({
      lang,
      path: `/tools/${slug}`,
      name: seo.title,
      description: seo.description,
      applicationCategory: slug === 'pdf-editor' ? 'BusinessApplication' : 'UtilitiesApplication',
      featureList: pdfEditorFeatures,
    }),
    breadcrumbJsonLd(
      [
        { name: t(nav.home, lang), path: '/' },
        { name: t(nav.tools, lang), path: '/tools' },
        { name: seo.title, path: `/tools/${slug}` },
      ],
      lang,
    ),
  ];

  if (slug === 'pdf-editor') {
    structuredData.push(
      faqJsonLd(
        lang === 'pt'
          ? [
              {
                question: 'Este editor de PDF é totalmente grátis e sem login?',
                answer:
                  'Sim! O Editor de PDF da lacorte.dev é 100% grátis, sem necessidade de login, cadastro ou cartão. Você pode editar textos, juntar PDFs, excluir páginas e exportar o PDF final gratuitamente sem marca d\'água.',
              },
              {
                question: 'Como editar, juntar, excluir páginas e exportar um PDF grátis?',
                answer:
                  'Basta enviar seu arquivo PDF, clicar em qualquer texto ou imagem para editar, usar o botão "Add PDF (Combine)" para juntar outros PDFs, clicar no ícone de lixeira para excluir páginas indesejadas e clicar em "Export PDF" para baixar gratuitamente.',
              },
            ]
          : [
              {
                question: 'Is this online PDF editor really free with no login needed?',
                answer:
                  'Yes! The lacorte.dev PDF Editor is 100% free with no login, account signup, or watermark. You can edit PDF text and images, merge PDFs, delete pages, and export your PDF for free directly in your browser.',
              },
              {
                question: 'How can I edit, merge, delete pages, and export a PDF for free?',
                answer:
                  'Upload your PDF file, click any text block or image to edit in-place, click "Add PDF (Combine)" to merge additional PDFs, use the trash icon on any page to delete pages, and click "Export PDF" to download your edited document for free.',
              },
            ],
      ),
    );
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <ToolPageClient
        slug={slug}
        title={seo.title}
        icon={tool.icon}
        description={seo.description}
        category={tool.category}
        lang={lang}
      />
    </>
  );
}
