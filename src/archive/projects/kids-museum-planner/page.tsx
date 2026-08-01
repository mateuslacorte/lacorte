import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, ProjectBreadcrumb } from '@/components/projects/ProjectPageParts';
import { absoluteUrl } from '@/lib/site';

const pageTitle = 'Kids Museum Planner | Day Planner for Interactive Museum Visits';
const pageDescription = 'Day planner for a kids museum experience — rooms, sessions, and points. Plan exhibits, track favorites, and log your visit.';

const dummyRooms = [
  { name: 'Space Lab', floor: '1F', session: 'Morning', points: 50 },
  { name: 'Ocean Discovery', floor: '1F', session: 'Morning', points: 40 },
  { name: 'Robot Workshop', floor: '2F', session: 'Afternoon', points: 60 },
  { name: 'Art Studio', floor: '2F', session: 'Afternoon', points: 35 },
  { name: 'Dino Dig', floor: '3F', session: 'All day', points: 45 },
  { name: 'Music Makers', floor: '3F', session: 'Afternoon', points: 30 },
];

const features = [
  { icon: '🏠', title: 'Home', subtitle: 'Live schedule', description: 'See available rooms at a glance based on the current session. Favorited rooms appear first.' },
  { icon: '🧭', title: 'Explore', subtitle: 'Search & map', description: 'Browse sample exhibit rooms by floor and category, and check locations on an interactive map.' },
  { icon: '📋', title: 'History', subtitle: 'Visit log', description: 'Record completed activities by date and track total visits and points earned.' },
];

const faqs = [
  { question: 'Is it free?', answer: 'Yes, completely free. No ads and no sign-up required.' },
  { question: 'What devices can I use it on?', answer: 'Any device with a web browser — smartphone, tablet, or PC.' },
  { question: 'Can I use it offline?', answer: 'After your first visit, it can install as a PWA and basic features work offline.' },
  { question: 'What are Explorer Points?', answer: 'Virtual currency earned after each activity. Spend them at museum shops. Each room awards different points.' },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: absoluteUrl('/projects/kids-museum-planner') },
};

export default function KidsMuseumPlannerPage() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Kids Museum Planner',
        description: pageDescription,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }} />

      <section className="py-16 px-4 bg-gradient-to-b from-blue-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <ProjectBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'Kids Museum Planner' },
          ]} />

          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-4">
              Interactive Kids Museum
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Kids Museum Planner</h1>
            <p className="text-xl text-[var(--color-text-muted)] mb-4">
              Plan your day at an interactive kids museum — rooms, sessions, and points
            </p>
            <p className="text-[var(--color-text-muted)] mb-8">
              A demo day planner with sample exhibit rooms and sessions. Browse activities, save favorites, and track points during your visit.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{feature.subtitle}</p>
                  </div>
                </div>
                <p className="text-[var(--color-text-muted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[var(--color-card)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Sample exhibit rooms</h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">Room</th>
                  <th className="px-4 py-3 text-sm font-semibold">Floor</th>
                  <th className="px-4 py-3 text-sm font-semibold">Session</th>
                  <th className="px-4 py-3 text-sm font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {dummyRooms.map((room) => (
                  <tr key={room.name}>
                    <td className="px-4 py-3 font-medium">{room.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{room.floor}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{room.session}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{room.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--color-card-hover)] transition-colors font-medium">
                  {faq.question}
                </summary>
                <div className="px-5 pb-5 text-[var(--color-text-muted)]">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
