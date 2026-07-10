import { useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from "react";


export type Theme = "dark" | "light";

export type ToggleFn = (x: number, y: number) => void;

export const COLORS: Record<Theme, string> = { dark: "#131310", light: "#eeeae4" };

export const MODE: Record<Theme, { blend: CSSProperties["mixBlendMode"]; op: number }> = {
  dark: { blend: "screen", op: 0.4 },
  light: { blend: "multiply", op: 0.6 },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}


const blobDefs = [
  { c: "#e8590c", rs: 0.22, ox: 0.18, oy: 0.3, axx: 0.3, axy: 0.26, fx: 0.00012, fy: 0.00008, p: 0 },
  { c: "#1971c2", rs: 0.26, ox: 0.72, oy: 0.25, axx: 0.28, axy: 0.32, fx: 0.00009, fy: 0.00013, p: 2.1 },
  { c: "#e64980", rs: 0.2, ox: 0.45, oy: 0.7, axx: 0.34, axy: 0.24, fx: 0.00014, fy: 0.0001, p: 4.2 },
  { c: "#0ca678", rs: 0.24, ox: 0.88, oy: 0.75, axx: 0.26, axy: 0.3, fx: 0.00008, fy: 0.00011, p: 1.3 },
  { c: "#6741d9", rs: 0.25, ox: 0.12, oy: 0.85, axx: 0.3, axy: 0.28, fx: 0.00011, fy: 0.00009, p: 3.4 },
  { c: "#f08c00", rs: 0.19, ox: 0.55, oy: 0.12, axx: 0.28, axy: 0.32, fx: 0.00013, fy: 0.0001, p: 5.1 },
];

export function Blobs({ style }: { style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [...ref.current!.children] as HTMLElement[];

    let raf = requestAnimationFrame(function tick(t) {
      const rc = ref.current!.getBoundingClientRect();

      for (const [i, d] of blobDefs.entries()) {
        const r = d.rs * rc.width;
        const x = (d.ox + Math.sin(t * d.fx + d.p) * d.axx) * rc.width - r;
        const y = (d.oy + Math.cos(t * d.fy + d.p) * d.axy) * rc.height - r;
        const el = els[i]!;

        el.style.width = el.style.height = r * 2 + "px";
        el.style.transform = `translate(${x}px,${y}px)`;
      }

      raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className="blobs" style={style}>
      {blobDefs.map(d => (
        <div
          key={d.c}
          className="blob"
          style={{ background: `radial-gradient(circle, ${d.c}cc 0%, ${d.c}55 45%, transparent 70%)` }}
        />
      ))}
    </div>
  );
}


export function Rim() {
  return (
    <>
      <div className="rim rim-white" />
      <div className="rim rim-black" />
    </>
  );
}

export function Noise() {
  return <div className="noise" />;
}

export function LiquidGlass({
  ref,
  className = "",
  style,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div ref={ref} className={`liquid-glass ${className}`} style={style}>
      <Rim />
      {children}
    </div>
  );
}

export function Button({ children }: { children: ReactNode }) {
  return (
    <button className="liquid-glass button">
      <Rim />
      {children}
    </button>
  );
}


export function ThemeIcon({ glass }: { glass: Theme }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {glass === "dark" ? (
        <>
          <circle cx="8" cy="8" r="3.2" />
          <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
        </>
      ) : (
        <path d="M13.5 9.8A6 6 0 0 1 6.2 2.5a6 6 0 1 0 7.3 7.3z" />
      )}
    </svg>
  );
}

export function ThemeToggle({ glass, onToggle }: { glass: Theme; onToggle: ToggleFn }) {
  return (
    <button className="theme-toggle" aria-label="Toggle theme" onClick={e => onToggle(e.clientX, e.clientY)}>
      <ThemeIcon glass={glass} />
    </button>
  );
}


export function Ripple({ x, y, theme, onEnd }: { x: number; y: number; theme: Theme; onEnd: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  function onTransitionEnd(e: React.TransitionEvent) {
    if (e.target === e.currentTarget && e.propertyName === "clip-path") onEnd();
  }

  useEffect(() => {
    const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        ref.current!.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
      }),
    );

    return () => cancelAnimationFrame(raf);
  }, [x, y]);

  return (
    <div ref={ref} className="ripple" style={{ clipPath: `circle(0px at ${x}px ${y}px)` }} onTransitionEnd={onTransitionEnd}>
      <div style={{ position: "absolute", inset: 0, background: COLORS[theme] }} />
      <Blobs style={{ mixBlendMode: MODE[theme].blend, opacity: MODE[theme].op }} />
    </div>
  );
}


const SNAP_SELECTOR = "button, a, [data-cursor-snap]";

function snapBox(el: HTMLElement) {
  const r = el.getBoundingClientRect();

  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
}

function snapRange(b: ReturnType<typeof snapBox>, pad: number) {
  return Math.max(b.w, b.h) / 2 + pad;
}

function findSnapTarget(mx: number, my: number, current: HTMLElement | null) {
  if (current?.isConnected) {
    const b = snapBox(current);
    if (Math.hypot(mx - b.cx, my - b.cy) < snapRange(b, 44)) return current;
  }

  const els = [...document.querySelectorAll<HTMLElement>(SNAP_SELECTOR)];

  return els.reduce<{ el: HTMLElement; dist: number } | null>((best, el) => {
    const b = snapBox(el);
    const dist = Math.hypot(mx - b.cx, my - b.cy);

    if (dist >= snapRange(b, 16)) return best;
    return !best || dist < best.dist ? { el, dist } : best;
  }, null)?.el ?? null;
}

export function SiteCursor() {
  const bubRef = useRef<HTMLDivElement>(null);
  const s = useRef({ mx: -100, my: -100, x: -100, y: -100, w: 30, h: 30, tw: 30, th: 30, inside: false, target: null as HTMLElement | null });

  useEffect(() => {
    const st = s.current;

    function onMouseMove(e: globalThis.MouseEvent) {
      Object.assign(st, { mx: e.clientX, my: e.clientY, inside: true });
    }

    function onMouseLeave() {
      Object.assign(st, { inside: false, target: null });
    }

    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    let raf = requestAnimationFrame(function tick() {
      st.target = st.inside ? findSnapTarget(st.mx, st.my, st.target) : null;

      let tx = st.mx;
      let ty = st.my;
      let ease = 0.2;

      if (st.target) {
        const b = snapBox(st.target);
        const dx = st.mx - b.cx;
        const dy = st.my - b.cy;
        const dist = Math.hypot(dx, dy);

        const off = Math.min(dist / snapRange(b, 44), 1) * 9;
        tx = b.cx + (dx / (dist || 1)) * off;
        ty = b.cy + (dy / (dist || 1)) * off;
        ease = 0.12;
        Object.assign(st, { tw: b.w + 26, th: b.h - 8 });
      } else {
        Object.assign(st, { tw: 30, th: 30 });
      }

      st.x = lerp(st.x, tx, ease);
      st.y = lerp(st.y, ty, ease);
      st.w = lerp(st.w, st.tw, 0.18);
      st.h = lerp(st.h, st.th, 0.18);

      const bub = bubRef.current!.style;
      bub.width = st.w + "px";
      bub.height = st.h + "px";
      bub.borderRadius = st.h / 2 + "px";
      bub.transform = `translateZ(0) translate(${st.x - st.w / 2}px,${st.y - st.h / 2}px)`;
      bub.opacity = st.inside ? "1" : "0";

      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <LiquidGlass ref={bubRef} className="bubble">
      <Noise />
    </LiquidGlass>
  );
}
