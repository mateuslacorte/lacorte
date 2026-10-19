'use client';

import '@/lib/polyfills';
import React, { useState, useCallback } from 'react';
import { PDFPageItem } from '@/types/pdf';
import {
  renderPageThumbnail,
  getPdfJs,
  extractPageContentForEditing,
} from '@/lib/pdf-engine';
import { FileDropzone } from '@/components/tools/pdf-editor/FileDropzone';
import { WordStyleEditor } from '@/components/tools/pdf-editor/WordStyleEditor';
import { useTranslation } from '@/i18n/useTranslation';
import type { Language } from '@/i18n';

export default function PdfEditorTool({ lang: routeLang }: { lang?: Language }) {
  const { lang } = useTranslation(routeLang);
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [fileMap, setFileMap] = useState<Map<string, ArrayBuffer>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Ingest and parse PDF files into continuous document pages
   */
  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsLoading(true);

    try {
      const pdfjs = await getPdfJs();
      if (!pdfjs) throw new Error('PDF.js could not be loaded');

      const newPages: PDFPageItem[] = [];
      const updatedFileMap = new Map(fileMap);

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        updatedFileMap.set(fileId, arrayBuffer);

        const pdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer.slice(0)),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/standard_fonts/',
          fontExtraProperties: true,
        }).promise;
        const pageCount = pdf.numPages;

        for (let i = 0; i < pageCount; i++) {
          const { dataUrl, width, height } = await renderPageThumbnail(arrayBuffer, i, 2.0);
          const extracted = await extractPageContentForEditing(arrayBuffer, i);

          newPages.push({
            id: `${fileId}-p${i}`,
            fileId,
            fileName: file.name,
            pageIndex: i,
            pageNumber: newPages.length + 1,
            thumbnailUrl: dataUrl,
            rotation: 0,
            selectedForSplit: false,
            textItems: extracted.textItems,
            imageItems: extracted.imageItems,
            width: extracted.width || width,
            height: extracted.height || height,
            isParsedForEditing: true,
          });
        }
      }

      setFileMap(updatedFileMap);
      setPages((prev) => [...prev, ...newPages]);
    } catch (err: any) {
      console.error(err);
      const prefix = lang === 'pt' ? 'Erro ao carregar o PDF: ' : 'Error loading PDF: ';
      alert(prefix + (err.message || (lang === 'pt' ? 'Erro desconhecido' : 'Unknown error')));
    } finally {
      setIsLoading(false);
    }
  }, [fileMap, lang]);

  const handleReset = () => {
    setPages([]);
    setFileMap(new Map());
  };

  return (
    <div
      className="w-full bg-[#f8fafc] text-[#0f172a]"
      style={{
        colorScheme: 'light',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {pages.length === 0 ? (
        <FileDropzone onFilesSelected={handleFilesSelected} isLoading={isLoading} lang={lang} />
      ) : (
        <WordStyleEditor
          pages={pages}
          fileMap={fileMap}
          onUpdatePages={setPages}
          onUploadMore={handleFilesSelected}
          onReset={handleReset}
          lang={lang}
        />
      )}
    </div>
  );
}
