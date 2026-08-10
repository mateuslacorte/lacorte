import Image from 'next/image';

function isImageIcon(icon: string) {
  return icon.startsWith('/') || icon.startsWith('http://') || icon.startsWith('https://');
}

export function ProjectIcon({
  icon,
  alt,
  size = 64,
  className = '',
}: {
  icon: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (isImageIcon(icon)) {
    return (
      <Image
        src={icon}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-2xl shadow-md object-cover ${className}`}
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size * 0.75 }} aria-hidden="true">
      {icon}
    </span>
  );
}
