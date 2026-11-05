/**
 * EPHAPHATA - central configuration
 * ------------------------------------------------------------------
 * Anything an editor may need to change lives here or in the database.
 * Anything marked PROVISIONAL must be confirmed by the event team.
 */

export const site = {
  name: "EPHAPHATA",
  host: "OT POWER",
  hostFull: "OT Power & The Attackers",
  tagline: "One gathering. One purpose.",
  description:
    "EPHAPHATA is a worship and spiritual gathering with OT Power & The Attackers - a night of sound, word and surrender.",
  // PROVISIONAL - replace with the approved official contact details.
  email: "hello@ephaphata.com",
  phone: "+234 800 000 0000",
  social: {
    instagram: "https://instagram.com/otesepower",
    tiktok: "https://tiktok.com/@otesepower",
    youtube: "https://youtube.com/@otesepower",
    facebook: "https://facebook.com/otesepower",
  },
  // Canonical origin. Vercel exposes VERCEL_URL for previews; NEXT_PUBLIC_SITE_URL
  // always wins. The localhost fallback only ever applies in development.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.NODE_ENV === "production" ? "https://ephaphata.com" : "http://localhost:3000"),
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Programme", href: "/programme" },
  { label: "Media", href: "/media" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Prayer", href: "/prayer" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  {
    title: "Gathering",
    links: [
      { label: "About EphaPhata", href: "/about" },
      { label: "All events", href: "/events" },
      { label: "Programme", href: "/programme" },
      { label: "Media & gallery", href: "/media" },
    ],
  },
  {
    title: "Take part",
    links: [
      { label: "Register", href: "/events" },
      { label: "Volunteer", href: "/volunteer" },
      { label: "Prayer request", href: "/prayer" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "FAQs", href: "/faq" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
      { label: "Organiser login", href: "/admin/login" },
    ],
  },
] as const;

/** The five supplied background families, keyed for <BrandBG family="…"> */
export const brandBackgrounds = {
  green: "/brand/bg/green",
  multicolor: "/brand/bg/multicolor",
  red: "/brand/bg/red",
  pink: "/brand/bg/pink",
  blue: "/brand/bg/blue",
} as const;

export type BrandFamily = keyof typeof brandBackgrounds;

export const HEARD_VIA_LABELS: Record<string, string> = {
  social_media: "Social media",
  friend_or_family: "Friend or family",
  church: "Church announcement",
  flyer: "Flyer",
  whatsapp: "WhatsApp",
  radio_tv: "Radio / TV",
  previous_edition: "Previous edition",
  other: "Other",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  undecided: "Still deciding",
};
