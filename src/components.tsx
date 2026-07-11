import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";


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
      if (!ref.current) return;

      const rc = ref.current.getBoundingClientRect();

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
  highlight,
  children,
  ...rest
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  highlight?: boolean;
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div ref={ref} className={`liquid-glass ${className}`} style={style} data-glass-highlight={highlight ? "" : undefined} {...rest}>
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
        if (ref.current) ref.current.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
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


// Snap constants + math below mirror SiteCursor in src/cursor.tsx so this demo's
// acquire / pull / morph / release feel is byte-for-byte identical to the real
// site cursor. Coordinates are stage-local here (the bubble lives inside the
// stage) rather than viewport, but the geometry is relative so the same numbers
// apply. Keep in sync with cursor.tsx: BUBBLE_SIZE, glide, snapRange(6/14), the
// *4 pull offset, tw = w + 12 / th = h - 4, and eases 0.28 / 0.25.
const BUBBLE_SIZE = 30;


type Glide = { x: number; v: number };

function glide(g: Glide, target: number, r: number) {
  g.v = lerp(g.v, target, r);
  g.x = lerp(g.x, g.v, r);
  return g.x;
}


type SnapBox = { cx: number; cy: number; w: number; h: number };

function snapRange(b: SnapBox, pad: number) {
  return Math.max(b.w, b.h) / 2 + pad;
}


export function GlassCursor() {
  const stageRef = useRef<HTMLDivElement>(null);
  const bubRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const s = useRef({
    mx: 80, my: 80, inside: false, snapped: false, opacity: 0,
    x: { x: 80, v: 80 }, y: { x: 80, v: 80 },
    w: { x: BUBBLE_SIZE, v: BUBBLE_SIZE }, h: { x: BUBBLE_SIZE, v: BUBBLE_SIZE },
  });

  function onMouseMove(e: MouseEvent) {
    const r = stageRef.current!.getBoundingClientRect();

    Object.assign(s.current, { mx: e.clientX - r.left, my: e.clientY - r.top, inside: true });
  }

  function onMouseLeave() {
    Object.assign(s.current, { inside: false, snapped: false });
  }

  useEffect(() => {
    const st = s.current;

    let raf = requestAnimationFrame(function tick() {
      if (!stageRef.current || !targetRef.current || !bubRef.current) return;

      const rc = stageRef.current.getBoundingClientRect();
      const tr = targetRef.current.getBoundingClientRect();
      const b: SnapBox = { cx: tr.left - rc.left + tr.width / 2, cy: tr.top - rc.top + tr.height / 2, w: tr.width, h: tr.height };

      const dx = st.mx - b.cx;
      const dy = st.my - b.cy;
      const dist = Math.hypot(dx, dy);

      const acquired = dist < snapRange(b, 6);
      st.snapped = st.inside && (acquired || (st.snapped && dist < snapRange(b, 14)));

      let tx = st.mx;
      let ty = st.my;
      let tw = BUBBLE_SIZE;
      let th = BUBBLE_SIZE;
      let ease = 0.35;

      if (st.snapped) {
        const off = Math.min(dist / snapRange(b, 14), 1) * 4;
        tx = b.cx + (dx / (dist || 1)) * off;
        ty = b.cy + (dy / (dist || 1)) * off;
        tw = b.w + 12;
        th = b.h - 4;
        ease = 0.28;
      }

      glide(st.x, tx, ease);
      glide(st.y, ty, ease);
      glide(st.w, tw, 0.25);
      glide(st.h, th, 0.25);
      st.opacity = lerp(st.opacity, st.inside ? 1 : 0, 0.3);

      const w = Math.max(st.w.x, 0);
      const h = Math.max(st.h.x, 0);

      const bub = bubRef.current.style;
      bub.width = w + "px";
      bub.height = h + "px";
      bub.borderRadius = h / 2 + "px";
      bub.transform = `translateZ(0) translate(${st.x.x - w / 2}px,${st.y.x - h / 2}px)`;
      bub.opacity = String(st.opacity);

      raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={stageRef} className="stage cursor-stage" data-cursor-local onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <LiquidGlass ref={bubRef} className="bubble bubble-local">
        <Noise />
      </LiquidGlass>
      <div ref={targetRef} className="target">Hover me</div>
    </div>
  );
}
