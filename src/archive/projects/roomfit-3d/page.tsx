import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureCard, JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl, SITE_URL } from '@/lib/site';

const pageTitle = 'RoomFit 3D | Plan Furniture in a Measured 3D Room';
const pageDescription = 'Plan furniture layouts in a dimension-accurate 3D room with magnetic snapping and fit checks.';
const appUrl = 'https://roomfit-3d.vercel.app';

const features = [
  { title: 'Accurate Measurements', description: 'Build a room from real dimensions and size every object in millimeters before moving anything at home.' },
  { title: 'Magnetic Placement', description: 'Snap objects cleanly to nearby walls while keeping their measured position visible as you arrange the room.' },
  { title: 'Fit Checks', description: 'See boundary, collision, door-swing, clearance, and aisle warnings while you test a layout.' },
  { title: 'Local-First Storage', description: 'Autosave projects in the browser and import or export versioned JSON without creating an account.' },
];

const techStack = [
  { label: 'Interface', value: 'React, TypeScript' },
  { label: '3D Rendering', value: 'Three.js, React Three Fiber' },
  { label: 'State and Build', value: 'Zustand, Vite' },
  { label: 'Testing', value: 'Vitest, Playwright' },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/roomfit-3d') },
};

export default function RoomFit3DPage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'RoomFit 3D',
        description: pageDescription,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: appUrl,
      }} />

      <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent">
        <div className="relative max-w-5xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'RoomFit 3D' },
          ]} />

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-4xl mr-1" aria-hidden="true">🛋️</span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">3D Planner</span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">Dimension Accurate</span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">No Sign-Up</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">RoomFit 3D</h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[var(--color-text-muted)] mb-8">
              Measure the room, place simple furniture shapes, and find layout problems before the furniture arrives.
            </p>

            <Link
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
            >
              Open Live App
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Plan with confidence</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <article key={feature.title} className="group p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white flex items-center justify-center font-bold mb-5">{index + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="leading-relaxed text-[var(--color-text-muted)]">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-[var(--color-border)] bg-[var(--color-card)]/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Built for a responsive 3D workflow</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {techStack.map((item) => (
              <div key={item.label} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{item.label}</p>
                <p className="font-semibold text-lg">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
