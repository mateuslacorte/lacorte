import Image from 'next/image';

interface SiteLogoMarkProps {
  className?: string;
}

export function SiteLogoMark({ className = '' }: SiteLogoMarkProps) {
  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-lg shadow-primary-500/20 ${className}`}
      aria-hidden
    >
      <Image
        src="/icon-192.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-cover"
        priority
      />
    </span>
  );
}
