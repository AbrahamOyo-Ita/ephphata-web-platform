"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Display headline reveal - opacity only.
 * ------------------------------------------------------------------
 * The word-mask rise was the single most "SaaS motion" element on the site.
 * In the refined direction headlines simply fade in, staggered very slightly,
 * with no vertical travel. Text stays plain, selectable and accessible.
 */
export function SplitText({
  text,
  as: Tag = "span",
  className = "",
  wordClassName = "",
  delay = 0,
  step = 45,
  duration = 420,
  trigger = "scroll",
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  wordClassName?: string;
  delay?: number;
  step?: number;
  duration?: number;
  trigger?: "scroll" | "mount";
  /** Optional anchor id (used for aria-labelledby targets) */
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (trigger === "mount") {
      const t = window.setTimeout(() => setGo(true), 60);
      return () => window.clearTimeout(t);
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGo(true);
      return;
    }
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setGo(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className} aria-label={text} id={id}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true">
          <span
            className={`inline-block ${wordClassName}`}
            style={{
              opacity: go ? 1 : 0,
              transition: `opacity ${duration}ms ease-out ${delay + i * step}ms`,
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Label reveal - opacity only. Kept as a distinct export so existing call sites
 * continue to work unchanged.
 */
export function SplitChars({
  text,
  className = "",
  delay = 0,
  step = 18,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setGo(true), 120 + delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  return (
    <span
      className={className}
      aria-label={text}
      style={{
        opacity: go ? 1 : 0,
        transition: `opacity 500ms ease-out ${delay}ms`,
      }}
    >
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

/**
 * Previously a pointer-driven tilt surface. Parallax and 3D movement are
 * explicitly out of the design direction, so this is now a plain wrapper that
 * preserves the call-site API without any motion.
 */
export function Magnetic({
  children,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
