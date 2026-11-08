import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { getFeaturedEvent } from "@/lib/data/events";
import { AttendancePrompt } from "@/components/public/AttendancePrompt";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const featured = getFeaturedEvent();
  const registerHref = featured ? `/events/${featured.slug}/register` : "/register";

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader registerHref={registerHref} />
      <AttendancePrompt registerHref={registerHref} />
      <main id="main">{children}</main>
      <SiteFooter variant="multicolor" />
    </>
  );
}
