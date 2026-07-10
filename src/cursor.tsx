import { useEffect, useRef } from "react";
import { LiquidGlass, Noise } from "./components";


const HIGHLIGHT_SELECTOR = "[data-glass-highlight]";

const ENGAGE_RANGE = 44;
const BULGE_REACH = 42;
const BULGE_AMP = 13;
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


type Sample = { x: number; y: number; nx: number; ny: number };

function edgeSamples(x1: number, y1: number, x2: number, y2: number, nx: number, ny: number): Sample[] {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return [];

  const n = Math.max(1, Math.ceil(len / 8));
  return Array.from({ length: n }, (_, i) => ({ x: lerp(x1, x2, i / n), y: lerp(y1, y2, i / n), nx, ny }));
}

function arcSamples(cx: number, cy: number, r: number, a1: number, a2: number): Sample[] {
  if (r < 0.5) return [];

  const n = Math.max(4, Math.ceil(Math.abs(a2 - a1) * r / 8));
  return Array.from({ length: n }, (_, i) => {
    const a = lerp(a1, a2, i / n);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
  });
}

export function perimeterSamples(b: Box): Sample[] {
  const w = b.hw - b.r;
  const h = b.hh - b.r;
  const HPI = Math.PI / 2;

  return [
    ...edgeSamples(b.cx - w, b.cy - b.hh, b.cx + w, b.cy - b.hh, 0, -1),
    ...arcSamples(b.cx + w, b.cy - h, b.r, -HPI, 0),
    ...edgeSamples(b.cx + b.hw, b.cy - h, b.cx + b.hw, b.cy + h, 1, 0),
    ...arcSamples(b.cx + w, b.cy + h, b.r, 0, HPI),
    ...edgeSamples(b.cx + w, b.cy + b.hh, b.cx - w, b.cy + b.hh, 0, 1),
    ...arcSamples(b.cx - w, b.cy + h, b.r, HPI, Math.PI),
    ...edgeSamples(b.cx - b.hw, b.cy + h, b.cx - b.hw, b.cy - h, -1, 0),
    ...arcSamples(b.cx - w, b.cy - h, b.r, Math.PI, Math.PI + HPI),
  ];
}


type Bump = { x: number; y: number; amp: number; width: number };

function displace(s: Sample, bump: Bump): { x: number; y: number } {
  const t = smooth(1 - Math.hypot(s.x - bump.x, s.y - bump.y) / bump.width);
  return { x: s.x + s.nx * bump.amp * t, y: s.y + s.ny * bump.amp * t };
}

export function bulgePath(b: Box, bump: Bump | null) {
  const pts = bump && bump.amp > 0.05 ? perimeterSamples(b).map(s => displace(s, bump)) : perimeterSamples(b);
  return toPathD(pts);
}

function toPathD(pts: { x: number; y: number }[]) {
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


function findTarget(mx: number, my: number) {
  const els = [...document.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR)];

  const cands = els
    .map(el => ({ el, box: measure(el) }))
    .filter(c => c.box.hw > 0)
    .map(c => ({ ...c, d: signedDistance(c.box, mx, my) }))
    .filter(c => c.d < ENGAGE_RANGE);

  const outside = cands.filter(c => c.d >= 0);
  if (outside.length) return outside.reduce((a, c) => (c.d < a.d ? c : a));

  return cands.reduce<(typeof cands)[number] | null>((a, c) => (!a || c.d > a.d ? c : a), null);
}


export function SiteCursor() {
  const bubRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<SVGCircleElement>(null);
  const shellRef = useRef<SVGGElement>(null);
  const sliverRef = useRef<SVGPathElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  const s = useRef({
    mx: -100, my: -100, inside: false,
    x: -100, y: -100, size: BUBBLE_SIZE, opacity: 0, stretch: 0, angle: 0,
    target: null as HTMLElement | null, fading: null as HTMLElement | null, box: null as Box | null,
    amp: 0, bx: 0, by: 0, shell: 0, spotX: 0, spotY: 0, spotO: 0, spotR: 26,
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

    function acquire(el: HTMLElement | null, sp: { x: number; y: number } | null) {
      if (el) st.target?.style.removeProperty("--rim-fade");
      else st.fading = st.target;

      if (st.fading && st.fading !== st.target && el) restoreFading();
      st.target = el;

      if (el && sp) Object.assign(st, { bx: sp.x, by: sp.y, spotX: st.mx, spotY: st.my });
    }

    function restoreFading() {
      st.fading?.style.removeProperty("--rim-fade");
      st.fading = null;
    }

    function step() {
      const found = st.inside ? findTarget(st.mx, st.my) : null;
      const sp = found ? surfacePoint(found.box, st.mx, st.my) : null;

      if ((found?.el ?? null) !== st.target) acquire(found?.el ?? null, sp);
      if (found) st.box = found.box;

      const d = found ? found.d : Infinity;
      const grown = found ? smooth(d / ENGAGE_RANGE) : 1;

      let tx = st.mx;
      let ty = st.my;
      let ease = 0.22;

      let ampT = 0;
      if (found) {
        const reach = d < 0 ? Math.min(BULGE_REACH, Math.min(found.box.hw, found.box.hh) * 0.8) : BULGE_REACH;
        ampT = BULGE_AMP * smooth(1 - Math.abs(d) / reach);
        if (d > 0) ampT = Math.min(ampT, d);
      }

      if (found && sp && d >= 0) {
        tx = lerp(st.mx, sp.x + sp.nx * ampT, 1 - grown);
        ty = lerp(st.my, sp.y + sp.ny * ampT, 1 - grown);
        ease = 0.3;
        st.angle = Math.atan2(sp.ny, sp.nx);
      }

      const stretchT = found && d >= 0 ? smooth(1 - d / 44) * 0.6 : 0;
      st.stretch = lerp(st.stretch, stretchT, 0.25);

      st.amp = lerp(st.amp, ampT, 0.25);
      if (sp) st.bx = lerp(st.bx, sp.x, 0.35);
      if (sp) st.by = lerp(st.by, sp.y, 0.35);

      st.x = lerp(st.x, tx, ease);
      st.y = lerp(st.y, ty, ease);
      st.size = lerp(st.size, BUBBLE_SIZE * grown, 0.22);
      st.opacity = lerp(st.opacity, st.inside && grown > 0.1 ? 1 : 0, 0.3);

      st.shell = lerp(st.shell, found ? 1 : 0, 0.25);
      st.spotO = lerp(st.spotO, found ? 1 - grown : 0, 0.25);
      st.spotX = lerp(st.spotX, st.mx, 0.3);
      st.spotY = lerp(st.spotY, st.my, 0.3);
      if (st.box) st.spotR = lerp(st.spotR, clamp(Math.min(st.box.hw, st.box.hh) * 0.7, 22, 48), 0.2);

      render();
      raf = requestAnimationFrame(step);
    }

    function render() {
      const len = st.size * (1 + st.stretch);
      const girth = st.size * (1 - st.stretch * 0.35);

      const bub = bubRef.current!.style;
      bub.width = len + "px";
      bub.height = girth + "px";
      bub.borderRadius = girth / 2 + "px";
      bub.transform = `translateZ(0) translate(${st.x - len / 2}px,${st.y - girth / 2}px) rotate(${st.angle}rad)`;
      bub.opacity = String(st.opacity);

      shellRef.current!.style.opacity = String(st.shell);
      st.target?.style.setProperty("--rim-fade", String(1 - st.shell));

      if (st.fading && !st.target) st.fading.style.setProperty("--rim-fade", String(1 - st.shell));
      if (st.fading && !st.target && st.shell < 0.02) restoreFading();

      if (st.box && st.shell > 0.01) {
        const d = bulgePath(st.box, { x: st.bx, y: st.by, amp: st.amp, width: clamp(st.amp * 4.5, 44, 90) });
        for (const p of pathRefs.current) p?.setAttribute("d", d);

        sliverRef.current!.setAttribute("d", d + bulgePath(st.box, null));
      }

      const spot = spotRef.current!;
      spot.setAttribute("cx", String(st.spotX));
      spot.setAttribute("cy", String(st.spotY));
      spot.setAttribute("r", String(st.spotR));
      spot.style.opacity = String(st.spotO);
    }

    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      st.target?.style.removeProperty("--rim-fade");
      restoreFading();
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  function setPathRef(i: number) {
    return (el: SVGPathElement | null) => {
      pathRefs.current[i] = el;
    };
  }

  return (
    <>
      <svg className="morph-overlay" aria-hidden>
        <defs>
          <linearGradient id="morph-rim-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="30%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.03" />
            <stop offset="80%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="morph-rim-black" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#000" stopOpacity="0.3" />
            <stop offset="55%" stopColor="#000" stopOpacity="0.15" />
            <stop offset="80%" stopColor="#000" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="morph-spot">
            <stop offset="0%" className="spot-core" />
            <stop offset="45%" className="spot-mid" />
            <stop offset="75%" className="spot-ring" />
            <stop offset="100%" className="spot-end" />
          </radialGradient>
          <filter id="morph-spot-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <clipPath id="morph-clip">
            <path ref={setPathRef(0)} />
          </clipPath>
        </defs>
        <g ref={shellRef} style={{ opacity: 0 }}>
          <path ref={sliverRef} className="morph-sliver" fillRule="evenodd" />
          <g clipPath="url(#morph-clip)">
            <circle ref={spotRef} r="26" fill="url(#morph-spot)" filter="url(#morph-spot-blur)" />
          </g>
          <path ref={setPathRef(1)} className="morph-rim morph-rim-white" />
          <path ref={setPathRef(2)} className="morph-rim morph-rim-black" />
        </g>
      </svg>
      <LiquidGlass ref={bubRef} className="bubble">
        <Noise />
      </LiquidGlass>
    </>
  );
}
