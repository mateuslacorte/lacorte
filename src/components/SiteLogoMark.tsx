import Image from 'next/image';

interface SiteLogoMarkProps {
  className?: string;
}

export function SiteLogoMark({ className = '' }: SiteLogoMarkProps) {
  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg gradient-bg shadow-lg shadow-primary-500/20 ${className}`}
      aria-hidden
    >
      <Image
        src="/favicon.svg"
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px]"
        priority
      />
    </span>
  );
}
