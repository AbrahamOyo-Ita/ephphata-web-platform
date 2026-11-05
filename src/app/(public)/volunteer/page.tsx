import Link from "next/link";
import type { Metadata } from "next";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/public/PageHero";
import { VolunteerForm } from "@/components/public/VolunteerForm";
import { getDepartments, getFeaturedEvent } from "@/lib/data/events";
import { departmentLoad } from "@/lib/data/volunteers";
import { formatEventDate } from "@/lib/format";
import { Users2, Clock3, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Volunteer",
  description: "Serve at EphaPhata - ten departments, one purpose.",
};

export default function VolunteerPage() {
  const event = getFeaturedEvent();

  // No event yet = nothing to serve at yet. Keep the route alive with an honest
  // empty state instead of a 404, so the nav and search results stay valid.
  if (!event) {
    return (
      <>
        <PageHero
          eyebrow="Volunteer"
          title="SERVE AT EPHAPHATA"
          family="blue"
          priority
          lead={
            <p>
              Ten departments carry one gathering. Applications open when the next
              gathering is announced.
            </p>
          }
        />
        <section className="bg-white py-16 lg:py-20">
          <div className="shell-wide max-w-2xl">
            <p className="text-[1rem] leading-relaxed text-ink-600">
              There is no confirmed gathering to serve at yet. Follow the events page - the
              volunteer form opens as soon as a date is set.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/events" className="btn-ink">
                See upcoming events
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact the team
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const departments = getDepartments(event.id);
  const load = departmentLoad(event.id);
  const loadMap = new Map(load.map((l) => [l.id, l]));

  return (
    <>
      <PageHero
        eyebrow="Volunteer"
        title="SERVE AT EPHAPHATA"
        family="blue"
        priority
        lead={
          <p>
            Ten departments carry one gathering. If you can hold a door, run a desk, carry a
            camera or pray through an evening - there is a place for you.
          </p>
        }
        meta={[
          { label: "Departments", value: `${departments.length} teams` },
          { label: "Commitment", value: "Event day + briefing" },
          { label: "Every application", value: "Reviewed personally" },
          { label: "Location", value: "Calabar, Cross River State" },
        ]}
      />

      {/* Departments */}
      <section className="bg-white py-14 lg:py-20">
        <div className="shell-wide">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Reveal variant="fade">
                <p className="eyebrow text-ink-600">The teams</p>
              </Reveal>
              <SplitText
                as="h2"
                text="WHERE YOU COULD SERVE"
                className="mt-5 block font-display text-display-sm text-ink-900"
                step={46}
              />
              <Reveal delay={160}>
                <p className="mt-5 text-[0.875rem] leading-relaxed text-ink-600">
                  Choose a first and second preference on the form. The coordination team will
                  place you where you are most useful, and tell you either way.
                </p>
              </Reveal>
              <Reveal delay={220}>
                <div className="mt-6 rounded-sm border border-ink-900/10 bg-paper-50 p-4">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                    Serving at
                  </p>
                  <p className="mt-1.5 font-display text-[0.9375rem] uppercase tracking-wide text-ink-900">
                    {event.title}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-ink-500">{formatEventDate(event.starts_at)}</p>
                </div>
              </Reveal>
            </div>

            <div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {departments.map((dept, i) => {
                  const l = loadMap.get(dept.id);
                  const full = dept.capacity ? (l?.accepted ?? 0) >= dept.capacity : false;
                  return (
                    <Reveal key={dept.id} delay={i * 50}>
                      <div className="group h-full rounded-sm border border-ink-900/[0.08] bg-white p-4 transition-colors duration-300 hover:border-ink-900/20">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[0.875rem] font-semibold text-ink-900">{dept.name}</h3>
                          <span className="font-mono text-[0.625rem] text-ink-300">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[0.6875rem] text-ink-400">
                          {dept.capacity
                            ? `${l?.accepted ?? 0} accepted · ${dept.capacity} places`
                            : "Open places"}
                          {full && <span className="ml-1.5 font-semibold text-flame-600">Full</span>}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Form */}
              <div id="apply" className="mt-10 scroll-mt-24">
                <Reveal variant="fade">
                  <h2 className="font-display text-lg uppercase tracking-wide text-ink-900">
                    Your application
                  </h2>
                  <p className="mt-1.5 text-[0.8125rem] text-ink-500">
                    Takes about two minutes. We read every one.
                  </p>
                </Reveal>

                <div className="mt-7">
                  <VolunteerForm
                    eventSlug={event.slug}
                    departments={departments.map((d) => ({ id: d.id, name: d.name }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
