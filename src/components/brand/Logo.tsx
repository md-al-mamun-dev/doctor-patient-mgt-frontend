'use client';

import Link from 'next/link';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LogoIconProps {
  size?: LogoSize;
  className?: string;
  badgeClassName?: string;
  withBadge?: boolean;
  ariaHidden?: boolean;
}

export interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  text?: string;
  href?: string | null;
  className?: string;
  badgeClassName?: string;
  textClassName?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

const badgeSizes: Record<LogoSize, string> = {
  sm: 'size-7 rounded-md',
  md: 'size-8 rounded-lg',
  lg: 'size-10 rounded-xl',
  xl: 'size-12 rounded-2xl',
};

const iconSizes: Record<LogoSize, string> = {
  sm: 'size-3.5',
  md: 'size-[18px]',
  lg: 'size-[22px]',
  xl: 'size-[26px]',
};

const textSizes: Record<LogoSize, string> = {
  sm: 'text-sm font-semibold tracking-tight',
  md: 'text-[15px] font-semibold tracking-tight',
  lg: 'text-lg font-bold tracking-tight',
  xl: 'text-xl font-bold tracking-tight',
};

/**
 * Pure SVG vector of the canonical Doctor Tracker emblem:
 * Clinical cross vertical pillars + continuous active ECG pulse wave.
 */
export function MedicalPulseSvg({
  className = 'size-[18px]',
  ariaHidden = true,
}: {
  className?: string;
  ariaHidden?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={ariaHidden}
    >
      {/* Clinical Cross Vertical Stem */}
      <path d="M12 4v4m0 8v4" />
      {/* Active Clinical EKG Pulse Waveform */}
      <path d="M3 12h4l2.5-6 3.5 12 2.5-8 1.5 2H21" />
    </svg>
  );
}

/**
 * Standalone Icon Badge component for icon-only contexts, collapsed sidebars,
 * and avatar headers with theme-aware styling.
 */
export function LogoIcon({
  size = 'md',
  className = '',
  badgeClassName = '',
  withBadge = true,
  ariaHidden = true,
}: LogoIconProps) {
  const icon = (
    <MedicalPulseSvg
      className={`${iconSizes[size]} ${className}`}
      ariaHidden={ariaHidden}
    />
  );

  if (!withBadge) {
    return icon;
  }

  return (
    <span
      className={`grid place-items-center bg-brand-600 text-white shrink-0 shadow-xs transition-colors dark:bg-brand-500 dark:ring-1 dark:ring-white/10 dark:shadow-[0_0_12px_rgba(13,148,136,0.3)] ${badgeSizes[size]} ${badgeClassName}`}
    >
      {icon}
    </span>
  );
}

/**
 * Canonical brand logo component for headers, sidebar, mobile navigation,
 * and auth screens. Supports optional typography, responsive sizing, and link wrapping.
 */
export function Logo({
  size = 'md',
  showText = true,
  text = 'Doctor Tracker',
  href = '/dashboard',
  className = '',
  badgeClassName = '',
  textClassName = '',
  onClick,
  prefetch,
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={size} badgeClassName={badgeClassName} />
      {showText && (
        <span
          className={`text-ink transition-colors truncate ${textSizes[size]} ${textClassName}`}
        >
          {text}
        </span>
      )}
    </>
  );

  const containerClasses = `inline-flex items-center gap-2.5 rounded-lg select-none ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        prefetch={prefetch}
        className={`${containerClasses} hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
        aria-label={text}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses} onClick={onClick}>
      {content}
    </div>
  );
}

