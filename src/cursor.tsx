import { useEffect, useRef } from "react";
import { LiquidGlass, Noise } from "./components";


const HIGHLIGHT_SELECTOR = "[data-glass-highlight]";

const WAKE_RANGE = 64;
const ENGAGE_RANGE = 44;
const BUBBLE_SIZE = 30;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(Math.max(x, lo), hi);
}

function smooth(x: number) {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}


type Glide = { x: number; v: number };

function glide(s: Glide, target: number, r: number) {
  s.v = lerp(s.v, target, r);
  s.x = lerp(s.x, s.v, r);
  return s.x;
}


type Box = { cx: number; cy: number; hw: number; hh: number; r: number };

function measure(el: HTMLElement): Box {
  const rc = el.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

  const r = Math.min(radius, rc.width / 2, rc.height / 2);
  return { cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2, hw: rc.width / 2, hh: rc.height / 2, r };
}

export function signedDistance(b: Box, x: number, y: number) {
  const qx = Math.abs(x - b.cx) - (b.hw - b.r);
  const qy = Math.abs(y - b.cy) - (b.hh - b.r);

  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - b.r;
}

export function surfacePoint(b: Box, x: number, y: number) {
  const ix = clamp(x, b.cx - (b.hw - b.r), b.cx + (b.hw - b.r));
  const iy = clamp(y, b.cy - (b.hh - b.r), b.cy + (b.hh - b.r));

  const dx = x - ix;
  const dy = y - iy;
  const len = Math.hypot(dx, dy);

  if (len > 0.001) {
    const nx = dx / len;
    const ny = dy / len;
    return { x: ix + nx * b.r, y: iy + ny * b.r, nx, ny };
  }

  const walls = [
    { d: x - (b.cx - b.hw), x: b.cx - b.hw, y: iy, nx: -1, ny: 0 },
    { d: b.cx + b.hw - x, x: b.cx + b.hw, y: iy, nx: 1, ny: 0 },
    { d: y - (b.cy - b.hh), x: ix, y: b.cy - b.hh, nx: 0, ny: -1 },
    { d: b.cy + b.hh - y, x: ix, y: b.cy + b.hh, nx: 0, ny: 1 },
  ];

  const { x: sx, y: sy, nx, ny } = walls.reduce((a, w) => (w.d < a.d ? w : a));
  return { x: sx, y: sy, nx, ny };
}


function edgePoints(x1: number, y1: number, x2: number, y2: number) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return [] as { x: number; y: number }[];

  const n = Math.max(1, Math.ceil(len / 8));
  return Array.from({ length: n }, (_, i) => ({ x: lerp(x1, x2, i / n), y: lerp(y1, y2, i / n) }));
}

function arcPoints(cx: number, cy: number, r: number, a1: number, a2: number) {
  if (r < 0.5) return [] as { x: number; y: number }[];

  const n = Math.max(4, Math.ceil(Math.abs(a2 - a1) * r / 8));
  return Array.from({ length: n }, (_, i) => {
    const a = lerp(a1, a2, i / n);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

export function perimeter(b: Box) {
  const w = b.hw - b.r;
  const h = b.hh - b.r;
  const HPI = Math.PI / 2;

  return [
    ...edgePoints(b.cx - w, b.cy - b.hh, b.cx + w, b.cy - b.hh),
    ...arcPoints(b.cx + w, b.cy - h, b.r, -HPI, 0),
    ...edgePoints(b.cx + b.hw, b.cy - h, b.cx + b.hw, b.cy + h),
    ...arcPoints(b.cx + w, b.cy + h, b.r, 0, HPI),
    ...edgePoints(b.cx + w, b.cy + b.hh, b.cx - w, b.cy + b.hh),
    ...arcPoints(b.cx - w, b.cy + h, b.r, HPI, Math.PI),
    ...edgePoints(b.cx - b.hw, b.cy + h, b.cx - b.hw, b.cy - h),
    ...arcPoints(b.cx - w, b.cy - h, b.r, Math.PI, Math.PI + HPI),
  ];
}

export function outlinePath(b: Box) {
  const pts = perimeter(b);
  const n = pts.length;

  const curves = pts.map((p1, i) => {
    const p0 = pts[(i - 1 + n) % n]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    return `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  });

  return `M${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}${curves.join("")}Z`;
}


type Shell = { el: HTMLElement; box: Box; d: number; fade: number; path: string; seen: boolean };


export function SiteCursor() {
  const bubRef = useRef<HTMLDivElement>(null);
  const spotARef = useRef<SVGCircleElement>(null);
  const spotBRef = useRef<SVGCircleElement>(null);
  const ambientRef = useRef<SVGGElement>(null);
  const boostRef = useRef<SVGGElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const boostClipRef = useRef<SVGPathElement>(null);

  const s = useRef({
    mx: -100, my: -100, inside: false,
    x: { x: -100, v: -100 }, y: { x: -100, v: -100 }, size: { x: BUBBLE_SIZE, v: BUBBLE_SIZE }, opacity: 0,
    spotX: { x: -100, v: -100 }, spotY: { x: -100, v: -100 }, spotO: 0, spotR: 26,
    boostEl: null as HTMLElement | null, boostO: 0,
    shells: new Map<HTMLElement, Shell>(),
  });

  useEffect(() => {
    const st = s.current;

    function onMouseMove(e: globalThis.MouseEvent) {
      Object.assign(st, { mx: e.clientX, my: e.clientY, inside: true });
    }

    function onMouseLeave() {
      st.inside = false;
    }

    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    function wakeShells() {
      for (const shell of st.shells.values()) shell.seen = false;
      if (!st.inside) return;

      for (const el of document.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR)) {
        const box = measure(el);
        if (box.hw <= 0) continue;

        const d = signedDistance(box, st.mx, st.my);
        if (d >= WAKE_RANGE && !st.shells.has(el)) continue;

        const shell = st.shells.get(el) ?? { el, box, d, fade: 0, path: "", seen: true };
        Object.assign(shell, { box, d, path: outlinePath(box), seen: true });
        st.shells.set(el, shell);
      }
    }

    function nearestShell() {
      const shells = [...st.shells.values()].filter(sh => sh.seen);
      return shells.reduce<Shell | null>((a, sh) => (!a || sh.d < a.d ? sh : a), null);
    }

    function updateBoost(shells: Shell[]) {
      const inner = shells
        .filter(sh => sh.seen && sh.d < 0)
        .reduce<Shell | null>((a, sh) => (!a || sh.d > a.d ? sh : a), null);

      const match = (inner?.el ?? null) === st.boostEl;
      st.boostO = lerp(st.boostO, inner && match ? 1 : 0, 0.25);
      if (!match && st.boostO < 0.05) st.boostEl = inner?.el ?? null;

      const boostShell = st.boostEl ? st.shells.get(st.boostEl) : null;
      boostClipRef.current!.setAttribute("d", boostShell?.path ?? "M0 0Z");
    }

    function step() {
      wakeShells();

      const shells = [...st.shells.values()];
      for (const shell of shells) {
        const engaged = shell.seen && shell.d < ENGAGE_RANGE;
        shell.fade = lerp(shell.fade, engaged ? 1 : 0, 0.22);
      }

      const clip = shells.filter(sh => sh.fade > 0.02).map(sh => sh.path);
      clipRef.current!.setAttribute("d", clip.join("") || "M0 0Z");

      for (const [el, shell] of st.shells) {
        if (!shell.seen && shell.fade < 0.02) st.shells.delete(el);
      }

      updateBoost(shells);
      const near = nearestShell();
      const dMin = near ? near.d : Infinity;
      const grown = near ? smooth(dMin / ENGAGE_RANGE) : 1;

      glide(st.x, st.mx, 0.35);
      glide(st.y, st.my, 0.35);
      glide(st.size, BUBBLE_SIZE * grown, 0.3);
      st.opacity = lerp(st.opacity, st.inside && grown > 0.1 ? 1 : 0, 0.3);

      st.spotO = lerp(st.spotO, near ? 1 - grown : 0, 0.25);
      glide(st.spotX, st.mx, 0.3);
      glide(st.spotY, st.my, 0.3);
      if (near) st.spotR = lerp(st.spotR, clamp(Math.min(near.box.hw, near.box.hh) * 0.7, 22, 48), 0.2);

      render();
      raf = requestAnimationFrame(step);
    }

    function render() {
      const size = Math.max(st.size.x, 0);

      const bub = bubRef.current!.style;
      bub.width = size + "px";
      bub.height = size + "px";
      bub.borderRadius = size / 2 + "px";
      bub.transform = `translateZ(0) translate(${st.x.x - size / 2}px,${st.y.x - size / 2}px)`;
      bub.opacity = String(st.opacity);

      for (const spot of [spotARef.current!, spotBRef.current!]) {
        spot.setAttribute("cx", String(st.spotX.x));
        spot.setAttribute("cy", String(st.spotY.x));
        spot.setAttribute("r", String(st.spotR));
      }

      ambientRef.current!.style.opacity = String(st.spotO * 0.45);
      boostRef.current!.style.opacity = String(st.spotO * 0.55 * st.boostO);
    }

    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      st.shells.clear();
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <>
      <svg className="morph-overlay" aria-hidden>
        <defs>
          <radialGradient id="morph-spot">
            <stop offset="0%" className="spot-core" />
            <stop offset="55%" className="spot-mid" />
            <stop offset="100%" className="spot-end" />
          </radialGradient>
          <filter id="morph-spot-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <clipPath id="morph-clip">
            <path ref={clipRef} />
          </clipPath>
          <clipPath id="morph-clip-boost">
            <path ref={boostClipRef} />
          </clipPath>
        </defs>
        <g ref={ambientRef} clipPath="url(#morph-clip)" style={{ opacity: 0 }}>
          <circle ref={spotARef} r="26" fill="url(#morph-spot)" filter="url(#morph-spot-blur)" />
        </g>
        <g ref={boostRef} clipPath="url(#morph-clip-boost)" style={{ opacity: 0 }}>
          <circle ref={spotBRef} r="26" fill="url(#morph-spot)" filter="url(#morph-spot-blur)" />
        </g>
      </svg>
      <LiquidGlass ref={bubRef} className="bubble">
        <Noise />
      </LiquidGlass>
    </>
  );
}
