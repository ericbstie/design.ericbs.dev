import { useEffect, useState, type RefObject } from "react";


const EXIT_FALLBACK_MS = 700;


function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}


// Keeps a node mounted through its CSS leave animation. `present` stays true
// after `open` turns false until the element's animationend fires (or a safety
// timer elapses), while `status` drives a `data-state` attribute for the CSS.
export function usePresence<T extends HTMLElement>(open: boolean, ref: RefObject<T | null>) {
  const [present, setPresent] = useState(open);


  if (open && !present) setPresent(true);

  const status = open ? "open" : "closed";


  useEffect(() => {
    if (open || !present) return;

    const node = ref.current;
    if (!node || prefersReducedMotion()) {
      setPresent(false);
      return;
    }

    function unmount(e?: AnimationEvent) {
      if (!e || e.target === node) setPresent(false);
    }

    const timer = setTimeout(unmount, EXIT_FALLBACK_MS);
    node.addEventListener("animationend", unmount);

    return () => {
      clearTimeout(timer);
      node.removeEventListener("animationend", unmount);
    };
  }, [open, present, ref]);


  return { present, status };
}
