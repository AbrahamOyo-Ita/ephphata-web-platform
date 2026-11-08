import type { Metadata } from "next";
import Link from "next/link";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { getFeaturedEvent } from "@/lib/data/events";
import { db } from "@/lib/db";
import type { FaqRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to the questions we are asked most often about Ephphata.",
};

const GENERAL = [
  {
    question: "What does Ephphata mean?",
    answer:
      "The name comes from the Aramaic word spoken in Mark 7:34 - \"be opened\". It frames everything about the gathering: an invitation for ears, hearts and lives to open to what God is doing.",
  },
  {
    question: "Who hosts Ephphata?",
    answer:
      "Ephphata is hosted by OT Power & The Attackers, with guest ministers joining each edition. The confirmed line-up for the next gathering is published on the event page.",
  },
  {
    question: "How do I know an announcement is official?",
    answer:
      "Only announcements published on this website and on the verified social channels listed in the footer are official. Treat forwarded flyers with altered dates or venues as unconfirmed until they appear here.",
  },
  {
    question: "Do I need to register to attend?",
    answer:
      "Registration is free and strongly recommended. It gives you a QR credential for faster check-in, and it lets the team prepare the hall and send you arrival instructions. Walk-ins are handled at the door as capacity allows.",
  },
  {
    question: "What happens to my data?",
    answer:
      "We collect only what is needed to manage the event. Registering does not subscribe you to marketing. Prayer requests are private and visible only to the prayer team. Full detail is in the privacy notice.",
  },
];

export default function FaqPage() {
  const event = getFeaturedEvent();
  const eventFaqs = event
    ? (db
        .prepare("SELECT * FROM event_faqs WHERE event_id = ? ORDER BY sort_order")
        .all(event.id) as FaqRow[])
    : [];

  const all = [
    ...eventFaqs.map((f) => ({ q: f.question, a: f.answer, group: event?.title ?? "Event" })),
    ...GENERAL.map((f) => ({ q: f.question, a: f.answer, group: "General" })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: all.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-white pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="shell-wide">
          <Reveal variant="fade">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 rounded-xs bg-ink-900" />
              <p className="eyebrow text-ink-600">FAQs</p>
            </div>
          </Reveal>

          <SplitText
            as="h1"
            text="QUESTIONS, ANSWERED"
            className="mt-6 block font-display text-display-lg text-ink-900"
            step={56}
            trigger="mount"
          />

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-ink-600">
              If your question isn&apos;t here, send it to the team - we add the useful ones to
              this page.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-section">
        <div className="shell-wide">
          <div className="mx-auto max-w-3xl">
            {["Event", "General"].map((group) => {
              const items = all.filter((f) => f.group === group || (group === "Event" && f.group !== "General" && f.group !== "Event"));
              const groupItems = group === "Event" ? all.filter((f) => f.group === event?.title) : all.filter((f) => f.group === "General");
              if (groupItems.length === 0) return null;
              return (
                <div key={group} className="mb-12">
                  <h2 className="mb-2 font-display text-sm uppercase tracking-[0.2em] text-ink-400">
                    {group}
                  </h2>
                  <div className="divide-y divide-ink-900/10 border-y border-ink-900/10">
                    {groupItems.map((item, i) => (
                      <Reveal key={item.q} delay={i * 50}>
                        <details className="group py-5">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[0.9375rem] font-semibold text-ink-900 marker:content-none">
                            {item.q}
                            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-xs border border-ink-900/15 text-ink-500 transition-colors duration-300 group-open:rotate-45 group-open:border-ink-900 group-open:bg-ink-900 group-open:text-white">
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                            </span>
                          </summary>
                          <p className="mt-3 max-w-2xl pr-10 text-[0.875rem] leading-relaxed text-ink-600">
                            {item.a}
                          </p>
                        </details>
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}

            <Reveal>
              <div className="rounded-md bg-ink-900 p-7 text-white">
                <h2 className="font-display text-xl uppercase tracking-wide">Still stuck?</h2>
                <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-white/65">
                  Send your question to the team. Enquiries are answered within two working days.
                </p>
                <Link href="/contact" className="btn-white btn-sm mt-5">
                  Contact the team
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
