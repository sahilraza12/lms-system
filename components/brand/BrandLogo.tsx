import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 40, className = '' }: BrandLogoProps) {
  return (
    <Image
      src="/logonavbar1-CCdzKR7I.png"
      alt="VIQ Technologies logo"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
