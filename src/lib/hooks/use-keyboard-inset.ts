"use client";

import { useEffect } from "react";

/** Below this, a shrunken visual viewport is browser chrome, not an on-screen keyboard. */
const KEYBOARD_MIN_PX = 80;
const MARGIN_PX = 12;

/** Height of the on-screen keyboard (0 when closed), from the visual viewport. */
export function keyboardHeight() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  const inset = window.innerHeight - vv.height;
  return inset > KEYBOARD_MIN_PX ? Math.round(inset) : 0;
}

/**
 * Keeps the focused field above the on-screen keyboard. iOS overlays the keyboard on the page
 * instead of resizing it, and a page that exactly fills the screen has nowhere to scroll to.
 * While the keyboard is open this sets `--keyboard-inset` (use it as extra bottom padding) and
 * scrolls the nearest `[data-keep-visible]` block around the focused field into view.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    const update = () => {
      const inset = keyboardHeight();
      root.style.setProperty("--keyboard-inset", `${inset}px`);
      const field = document.activeElement;
      if (!inset || !(field instanceof HTMLElement) || !field.matches("input, textarea")) return;
      // Let the padding apply before measuring.
      requestAnimationFrame(() => {
        const target = field.closest<HTMLElement>("[data-keep-visible]") ?? field;
        const visibleBottom = vv.offsetTop + vv.height;
        const overflow = target.getBoundingClientRect().bottom + MARGIN_PX - visibleBottom;
        if (overflow > 0) window.scrollBy({ top: overflow, behavior: "smooth" });
      });
    };

    vv.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    return () => {
      vv.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);
}
