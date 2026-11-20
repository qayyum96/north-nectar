"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page motion, ported from the approved mockup. Server Components opt in with data attributes,
 * so no section needs to become a client component:
 *
 *   data-rv="mask" | "img" | "rise" | "fade"  reveal when scrolled into view
 *   data-px="0.2"                              scroll parallax (factor of distance from centre)
 *   data-fan="l" | "r" | "c"                   showcase cards fan out as the section scrolls in
 *   data-ptr="12"   (inside [data-ptr-root])   pointer parallax in the hero (fine pointers only)
 *   data-mag                                   magnetic hover (fine pointers only)
 *   data-zoom       (inside a link/host)       image zoom on hover
 *   data-autoplay   (on <video>)               plays muted only while visible
 *
 * Content is fully visible without JavaScript (animations use `fill: backwards`), and nothing runs
 * when the visitor prefers reduced motion. The hero entrance and the floating leaves are pure CSS.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const ease = "cubic-bezier(.16,1,.3,1)";
    const cleanups: (() => void)[] = [];
    const $$ = <T extends Element = HTMLElement>(sel: string) =>
      Array.from(document.querySelectorAll<T & Element>(sel)) as T[];

    // Videos marked data-autoplay play (muted) only while on screen, even with reduced motion off.
    const videoIo = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && !reduce) {
            if (v.preload !== "auto") v.preload = "auto";
            v.muted = true;
            void v.play().catch(() => {});
          } else v.pause();
        }),
      { threshold: 0.15 },
    );
    $$<HTMLVideoElement>("video[data-autoplay]").forEach((v) => videoIo.observe(v));
    cleanups.push(() => videoIo.disconnect());

    if (reduce) return () => cleanups.forEach((fn) => fn());

    // 1. Reveal on scroll
    const reveal = (el: HTMLElement) => {
      const kind = el.dataset.rv;
      const opts = { easing: ease, fill: "backwards" as const };
      if (kind === "mask") {
        el.animate(
          [
            { clipPath: "inset(0 0 100% 0)", transform: "translateY(38%)" },
            { clipPath: "inset(0 0 0 0)", transform: "translateY(0)" },
          ],
          { ...opts, duration: 1100 },
        );
      } else if (kind === "img") {
        el.animate(
          [
            { clipPath: "inset(16% 16% 16% 16%)", scale: "1.18", opacity: 0.2 },
            { clipPath: "inset(0% 0% 0% 0%)", scale: "1", opacity: 1 },
          ],
          { ...opts, duration: 1500 },
        );
      } else if (kind === "rise") {
        Array.from(el.children).forEach((child, i) =>
          (child as HTMLElement).animate(
            [
              { opacity: 0, transform: "perspective(900px) translateY(56px) rotateX(14deg)" },
              { opacity: 1, transform: "perspective(900px) translateY(0) rotateX(0deg)" },
            ],
            { ...opts, duration: 1200, delay: i * 90 },
          ),
        );
      } else if (kind === "fade") {
        el.animate(
          [
            { opacity: 0, transform: "translateY(20px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { ...opts, duration: 900 },
        );
      }
    };
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px 8% 0px", threshold: 0.01 },
    );
    $$("[data-rv]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // 2. Scroll-linked parallax and the showcase fan
    const px = $$("[data-px]");
    const fan = {
      l: document.querySelector<HTMLElement>('[data-fan="l"]'),
      r: document.querySelector<HTMLElement>('[data-fan="r"]'),
      c: document.querySelector<HTMLElement>('[data-fan="c"]'),
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight || 900;
      px.forEach((el) => {
        const r = el.getBoundingClientRect();
        const off = r.top + r.height / 2 - vh / 2;
        el.style.translate = `0 ${(-off * parseFloat(el.dataset.px ?? "0")).toFixed(1)}px`;
      });
      if (fan.c) {
        const r = fan.c.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
        const e = 1 - Math.pow(1 - p, 3);
        const side = (dir: 1 | -1) =>
          `translateX(${(dir * (1 - e) * 38).toFixed(1)}%) rotate(${(-dir * 7 * e).toFixed(2)}deg) scale(${(0.86 + 0.14 * e).toFixed(3)})`;
        if (fan.l) fan.l.style.transform = side(1);
        if (fan.r) fan.r.style.transform = side(-1);
        fan.c.style.scale = (0.92 + 0.08 * e).toFixed(3);
      }
    };
    if (px.length || fan.c) {
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      });
    }

    if (fine) {
      // 3. Pointer parallax inside the hero
      $$("[data-ptr-root]").forEach((root) => {
        const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-ptr]"));
        layers.forEach((l) => (l.style.transition = `translate 0.9s ${ease}`));
        const move = (ev: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const dx = (ev.clientX - r.left) / r.width - 0.5;
          const dy = (ev.clientY - r.top) / r.height - 0.5;
          layers.forEach((l) => {
            const k = parseFloat(l.dataset.ptr ?? "0");
            l.style.translate = `${(dx * k).toFixed(1)}px ${(dy * k * 0.7).toFixed(1)}px`;
          });
        };
        const leave = () => layers.forEach((l) => (l.style.translate = "0px 0px"));
        root.addEventListener("pointermove", move);
        root.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          root.removeEventListener("pointermove", move);
          root.removeEventListener("pointerleave", leave);
        });
      });

      // 4. Magnetic buttons
      $$("[data-mag]").forEach((el) => {
        el.style.transition = `translate 0.5s ${ease}`;
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          el.style.translate = `${((ev.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px ${((ev.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`;
        };
        const leave = () => (el.style.translate = "0px 0px");
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // 5. Image zoom on hover
    $$("[data-zoom]").forEach((img) => {
      const host = (img.closest("a") as HTMLElement | null) ?? img.parentElement;
      if (!host) return;
      img.style.transition = `scale 0.7s ${ease}`;
      const on = () => (img.style.scale = "1.1");
      const off = () => (img.style.scale = "1");
      host.addEventListener("pointerenter", on);
      host.addEventListener("pointerleave", off);
      cleanups.push(() => {
        host.removeEventListener("pointerenter", on);
        host.removeEventListener("pointerleave", off);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
