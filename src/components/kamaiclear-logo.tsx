import { cn } from '@/lib/cn';

type KamaiClearLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: 'dark' | 'light';
};

/**
 * KamaiClear's core mark: a clear earnings path (the open C) with an
 * upward take-home signal. It stays recognisable at favicon size and in the
 * full sidebar lockup.
 */
export function KamaiClearLogo({ className, compact = false, variant = 'dark' }: KamaiClearLogoProps) {
  return (
    <div className={cn('kc-logo', compact && 'kc-logo-compact', variant === 'light' && 'kc-logo-light', className)} role="img" aria-label="KamaiClear — Net pay proof">
      <span className="kc-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <path d="M43 16.5a22 22 0 1 0 0 31" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
          <path d="m24 40 19-19m0 0H31m12 0v12" fill="none" stroke="var(--ak-amber)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        </svg>
      </span>
      {!compact && (
        <span className="kc-logo-lockup">
          <strong>Kamai<span>Clear</span></strong>
          <small>Net pay proof</small>
        </span>
      )}
    </div>
  );
}
