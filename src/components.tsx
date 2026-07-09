import { useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from "react";

export type Theme = "dark" | "light";

export const COLORS: Record<Theme, string> = { dark: "#131310", light: "#eeeae4" };
export const MODE: Record<Theme, { blend: CSSProperties["mixBlendMode"]; op: number }> = {
  dark: { blend: "screen", op: 0.55 },
  light: { blend: "multiply", op: 0.85 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const blobDefs = [
  { c: "#e8590c", r: 150, ox: 0.18, oy: 0.3, axx: 0.3, axy: 0.26, fx: 0.00042, fy: 0.00029, p: 0 },
  { c: "#1971c2", r: 180, ox: 0.72, oy: 0.25, axx: 0.28, axy: 0.32, fx: 0.00032, fy: 0.00045, p: 2.1 },
  { c: "#e64980", r: 140, ox: 0.45, oy: 0.7, axx: 0.34, axy: 0.24, fx: 0.0005, fy: 0.00035, p: 4.2 },
  { c: "#0ca678", r: 160, ox: 0.88, oy: 0.75, axx: 0.26, axy: 0.3, fx: 0.00027, fy: 0.0004, p: 1.3 },
  { c: "#6741d9", r: 170, ox: 0.12, oy: 0.85, axx: 0.3, axy: 0.28, fx: 0.00038, fy: 0.0003, p: 3.4 },
  { c: "#f08c00", r: 130, ox: 0.55, oy: 0.12, axx: 0.28, axy: 0.32, fx: 0.00045, fy: 0.00036, p: 5.1 },
];

export function Blobs({ style }: { style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current!;
    const blobs = blobDefs.map(d => {
      const el = document.createElement("div");
      el.style.cssText =
        `position:absolute;width:${d.r * 2}px;height:${d.r * 2}px;border-radius:50%;will-change:transform;` +
        `background:radial-gradient(circle, ${d.c}cc 0%, ${d.c}55 45%, transparent 70%)`;
      container.appendChild(el);
      return { el, d };
    });
    let raf = 0;
    const tick = (t: number) => {
      const rc = container.getBoundingClientRect();
      for (const { el, d } of blobs) {
        const x = (d.ox + Math.sin(t * d.fx + d.p) * d.axx) * rc.width - d.r;
        const y = (d.oy + Math.cos(t * d.fy + d.p) * d.axy) * rc.height - d.r;
        el.style.transform = `translate(${x}px,${y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      for (const { el } of blobs) el.remove();
    };
  }, []);

  return <div ref={ref} className="blobs" style={style} />;
}

export function Rim({ white, black }: { white?: number; black?: number }) {
  return (
    <>
      <div className="rim rim-white" style={white !== undefined ? { opacity: white } : undefined} />
      <div className="rim rim-black" style={black !== undefined ? { opacity: black } : undefined} />
    </>
  );
}

export function Noise({ opacity }: { opacity?: number }) {
  return <div className="noise" style={opacity !== undefined ? { opacity } : undefined} />;
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

export function ThemeToggle({ glass, onToggle }: { glass: Theme; onToggle: (x: number, y: number) => void }) {
  return (
    <button className="theme-toggle" aria-label="Toggle theme" onClick={e => onToggle(e.clientX, e.clientY)}>
      <ThemeIcon glass={glass} />
    </button>
  );
}

export function Ripple({
  x,
  y,
  theme,
  onEnd,
}: {
  x: number;
  y: number;
  theme: Theme;
  onEnd: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
      }),
    );
    return () => cancelAnimationFrame(raf);
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="ripple"
      style={{ clipPath: `circle(0px at ${x}px ${y}px)` }}
      onTransitionEnd={e => {
        if (e.target === e.currentTarget && e.propertyName === "clip-path") onEnd();
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: COLORS[theme] }} />
      <Blobs style={{ mixBlendMode: MODE[theme].blend, opacity: MODE[theme].op }} />
    </div>
  );
}

export function CursorStage({ glass, onToggle }: { glass: Theme; onToggle: (x: number, y: number) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bubRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const s = useRef({ mx: 80, my: 80, x: 80, y: 80, w: 30, h: 30, tw: 30, th: 30, snapped: false, inside: false });

  useEffect(() => {
    const stage = stageRef.current!, bub = bubRef.current!, btn = btnRef.current!;
    const st = s.current;
    let raf = 0;
    const tick = () => {
      const rc = stage.getBoundingClientRect(), br = btn.getBoundingClientRect();
      const b = { cx: br.left - rc.left + br.width / 2, cy: br.top - rc.top + br.height / 2, w: br.width, h: br.height };
      const dx = st.mx - b.cx, dy = st.my - b.cy, dist = Math.hypot(dx, dy);

      const snapIn = Math.max(b.w, b.h) / 2 + 16;
      const snapOut = Math.max(b.w, b.h) / 2 + 44;
      if (!st.snapped && dist < snapIn) st.snapped = true;
      if (st.snapped && dist > snapOut) st.snapped = false;

      let tx = st.mx, ty = st.my, ease = 0.2;
      if (st.snapped) {
        const k = Math.min(dist / snapOut, 1);
        const off = k * 9;
        tx = b.cx + (dx / (dist || 1)) * off;
        ty = b.cy + (dy / (dist || 1)) * off;
        ease = 0.12;
        st.tw = b.w + 26;
        st.th = b.h - 8;
      } else {
        st.tw = 30;
        st.th = 30;
      }

      st.x = lerp(st.x, tx, ease);
      st.y = lerp(st.y, ty, ease);
      st.w = lerp(st.w, st.tw, 0.18);
      st.h = lerp(st.h, st.th, 0.18);

      bub.style.width = st.w + "px";
      bub.style.height = st.h + "px";
      bub.style.borderRadius = st.h / 2 + "px";
      bub.style.transform = `translateZ(0) translate(${st.x - st.w / 2}px,${st.y - st.h / 2}px)`;
      bub.style.opacity = st.inside ? "1" : "0";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={stageRef}
      className="stage cursor-stage"
      onMouseMove={e => {
        const r = stageRef.current!.getBoundingClientRect();
        s.current.mx = e.clientX - r.left;
        s.current.my = e.clientY - r.top;
        s.current.inside = true;
      }}
      onMouseLeave={() => {
        s.current.inside = false;
        s.current.snapped = false;
      }}
      onClick={e => {
        if (s.current.snapped) onToggle(e.clientX, e.clientY);
      }}
    >
      <Blobs />
      <LiquidGlass ref={bubRef} className="bubble">
        <Noise />
      </LiquidGlass>
      <button ref={btnRef} className="theme-toggle target" aria-label="Toggle theme">
        <ThemeIcon glass={glass} />
      </button>
    </div>
  );
}
