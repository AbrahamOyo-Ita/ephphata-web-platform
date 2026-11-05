/**
 * Brand marks as inline SVG.
 * lucide-react no longer ships brand logos, and pulling an icon font from a CDN
 * would break the sandboxed preview - so these are hand-written paths, sized and
 * coloured with currentColor.
 */
type IconProps = { className?: string };

export function InstagramIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.3" cy="6.7" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="5.2" width="20" height="13.6" rx="4.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.3 9.4v5.2l4.4-2.6-4.4-2.6Z" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.9 21v-7.3h2.5l.4-2.9h-2.9V9c0-.85.24-1.42 1.45-1.42h1.55V5.02A20.6 20.6 0 0 0 14.7 4.9c-2.2 0-3.7 1.34-3.7 3.8v2.1H8.5v2.9h2.5V21h2.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TiktokIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.2 3.2c.32 1.9 1.5 3.2 3.4 3.36v2.36a6.1 6.1 0 0 1-3.4-1.1v5.63a5.02 5.02 0 1 1-4.3-4.98v2.46a2.58 2.58 0 1 0 1.8 2.46V3.2h2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhatsappIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.4 20.6l1.35-4.1a8.15 8.15 0 1 1 3.1 3.06l-4.45 1.04Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 8.6c.2-.5.5-.5.75-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.25 0 .45-.15.65l-.45.55c-.15.2-.15.4-.05.6.5.85 1.15 1.5 2 1.9.2.1.4.05.55-.1l.55-.6c.15-.2.4-.25.6-.15l1.6.75c.25.1.35.3.33.5-.05.5-.4 1.2-.85 1.4-.45.2-1 .25-1.6.05a8.4 8.4 0 0 1-3.05-1.9 8.2 8.2 0 0 1-1.75-2.9c-.2-.65-.1-1.25.15-1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Maps a social key to its icon component. */
export const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  whatsapp: WhatsappIcon,
} as const;
