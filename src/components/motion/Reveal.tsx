"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Scroll reveal - opacity only.
 * ------------------------------------------------------------------
 * The refined direction is a calm, stable page. Nothing translates, scales or
 * rotates on scroll; content simply fades in once, briefly. Users who prefer
 * reduced motion see everything immediately, and without JS the content is
 * visible from the start.
 */

/** Kept for API compatibility; every variant now resolves to a plain fade. */
export type RevealVariant = "up" | "mask" | "clip" | "scale" | "fade" | "left" | "right";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useInViewOnce<T extends HTMLElement>(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setInView(true);
      return;
    }
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: options?.threshold ?? 0.12, rootMargin: options?.rootMargin ?? "0px 0px -5% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, inView };
}

type RevealProps = {
  children: ReactNode;
  /** Accepted but ignored - all reveals are a simple fade now. */
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: ElementType;
  once?: boolean;
};

export function Reveal({
  children,
  delay = 0,
  duration = 420,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transitionProperty: "opacity",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "ease-out",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
