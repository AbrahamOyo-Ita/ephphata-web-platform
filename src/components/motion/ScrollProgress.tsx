"use client";

import { useEffect, useState } from "react";

/** Thin brand-gradient reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? h.scrollTop / max : 0;
        setProgress(p);
        setVisible(h.scrollTop > 140);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background: "linear-gradient(90deg,#02C58A 0%,#08B1F2 32%,#D803E5 64%,#FE1430 100%)",
          transition: "transform 120ms linear",
        }}
      />
    </div>
  );
}
