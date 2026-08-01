import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const ogSize = { width: 1200, height: 630 };

export function truncateOgText(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function titleFontSize(title: string): number {
  if (title.length > 70) return 40;
  if (title.length > 50) return 48;
  if (title.length > 35) return 56;
  return 64;
}

export function PageOgImage({
  label,
  title,
  description,
  tags,
  footer = SITE_NAME,
  icon,
}: {
  label: string;
  title: string;
  description?: string;
  tags?: string[];
  footer?: string;
  icon?: string;
}) {
  const trimmedDescription = description ? truncateOgText(description, 180) : undefined;
  const visibleTags = (tags ?? []).filter(Boolean).slice(0, 6);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 45%, #09090b 100%)',
        color: '#fafafa',
        fontFamily: 'Courier New, monospace',
      }}
    >
      <div style={{ display: 'flex', fontSize: '20px', letterSpacing: '4px', color: '#a78bfa' }}>
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '980px' }}>
        {icon ? (
          <div style={{ display: 'flex', fontSize: '56px', lineHeight: 1 }}>{icon}</div>
        ) : null}
        <div
          style={{
            display: 'flex',
            fontSize: `${titleFontSize(title)}px`,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {title}
        </div>
        {trimmedDescription ? (
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              lineHeight: 1.35,
              color: '#d4d4d8',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {trimmedDescription}
          </div>
        ) : null}
        {visibleTags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
            {visibleTags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #3f3f46',
                  background: 'rgba(39, 39, 42, 0.8)',
                  color: '#a1a1aa',
                  fontSize: '20px',
                  letterSpacing: '1px',
                  fontFamily: 'Courier New, monospace',
                }}
              >
                #{tag}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', fontSize: '16px', letterSpacing: '3px', color: '#71717a' }}>
        {footer}
      </div>
    </div>
  );
}

export function DefaultOgImage() {
  return (
    <PageOgImage
      label="> DEV JOURNAL / ONLINE"
      title={SITE_NAME}
      description={SITE_DESCRIPTION}
      footer="BLOG · ARTICLES · TOOLS · GAMES · PROJECTS"
    />
  );
}

export function LlmWikiOgImage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: 'linear-gradient(135deg, #09090d 0%, #14141c 50%, #09090d 100%)',
        color: '#f4f0e8',
        fontFamily: 'Courier New, monospace',
      }}
    >
      <div style={{ display: 'flex', fontSize: '14px', letterSpacing: '3px', color: '#9b87ff' }}>
        INTERACTIVE FIELD GUIDE / 001
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '64px',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-3px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <div>Make knowledge</div>
          <div>compound.</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '24px',
            lineHeight: 1.4,
            color: '#aaa6b2',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <div>LLM Wiki is the idea.</div>
          <div>OpenWiki is the tool.</div>
          <div>OKF is the portable format.</div>
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: '14px', letterSpacing: '2px', color: '#777480' }}>
        LACORTE.DEV · JULY 2026
      </div>
    </div>
  );
}
