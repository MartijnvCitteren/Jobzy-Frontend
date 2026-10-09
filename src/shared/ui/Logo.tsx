import { useId, type CSSProperties } from 'react';
import styles from './Logo.module.css';

/** The symbol sizes the design system allows (px). */
export type LogoSize = 28 | 48 | 72 | 112 | 168;

export interface LogoProps {
  /** `symbol` is the mark alone; `lockup` pairs it with the "Jobzy" wordmark. */
  variant?: 'symbol' | 'lockup';
  size?: LogoSize;
  className?: string;
}

/**
 * Jobzy logo, drawn inline rather than via <img>: an SVG loaded as an image can't use the
 * page's Inter webfont (so the wordmark fell back to a system font) and its badge ring was a
 * fixed white fill. Here the wordmark is real text in Inter 800 and the ring is a true
 * knockout, so it shows whatever surface the logo sits on — as the design system requires.
 */
export function Logo({ variant = 'symbol', size = 28, className }: LogoProps) {
  const maskId = `jobzy-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isLockup = variant === 'lockup';
  const style = { '--logo-size': `${size}px` } as CSSProperties;

  return (
    <span
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={style}
      role="img"
      aria-label="Jobzy"
    >
      <svg className={styles.symbol} viewBox="0 0 134 134" aria-hidden="true" focusable="false">
        <mask id={maskId}>
          <rect width="134" height="134" fill="white" />
          <circle cx="103.5" cy="30.5" r="26" fill="black" />
        </mask>
        <rect className={styles.hub} x="4" y="18" width="112" height="112" rx="27" mask={`url(#${maskId})`} />
        <circle className={styles.signal} cx="103.5" cy="30.5" r="21" />
        <path className={styles.arrow} d="M103.5 22.9 L109.8 33.5 L97.2 33.5 Z" />
      </svg>
      {isLockup && (
        <span className={styles.wordmark} aria-hidden="true">
          Jobzy
        </span>
      )}
    </span>
  );
}
