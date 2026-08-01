import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/site';

const images = [
  { src: 'https://picsum.photos/seed/1/800/600', alt: 'Sample 1', title: 'Sample Image 1' },
  { src: 'https://picsum.photos/seed/2/800/600', alt: 'Sample 2', title: 'Sample Image 2' },
  { src: 'https://picsum.photos/seed/3/800/600', alt: 'Sample 3', title: 'Sample Image 3' },
  { src: 'https://picsum.photos/seed/4/800/600', alt: 'Sample 4', title: 'Sample Image 4' },
  { src: 'https://picsum.photos/seed/5/800/600', alt: 'Sample 5', title: 'Sample Image 5' },
  { src: 'https://picsum.photos/seed/6/800/600', alt: 'Sample 6', title: 'Sample Image 6' },
];

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photo gallery',
  alternates: { canonical: absoluteUrl('/projects/gallery') },
};

export default function GalleryPage() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-2">
            <Link href="/projects" className="hover:text-primary-500">Projects</Link>
            <span>/</span>
            <span>Gallery</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">📷 Gallery</h1>
          <p className="text-[var(--color-text-muted)]">Photo collection</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.src} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-medium">{image.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
