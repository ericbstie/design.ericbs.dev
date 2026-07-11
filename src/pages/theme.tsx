import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { LiquidGlass } from "../components";
import { Button, Tag } from "../ui";
import "./theme.css";


// ---------- Color math (WCAG) — everything a badge or swatch needs ----------

type RGBA = [number, number, number, number];

function parseRGB(str: string): RGBA {
  const m = str.match(/[\d.]+/g);
  if (!m) return [0, 0, 0, 1];

  const [r = 0, g = 0, b = 0, a] = m.map(Number);
  // color-mix serializes to color(srgb 0..1 0..1 0..1 / a); rgb() is 0..255.
  const scale = str.includes("color(") ? 255 : 1;
  return [r * scale, g * scale, b * scale, a === undefined ? 1 : a];
}

function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

function luminance([r, g, b]: RGBA) {
  function lin(v: number) {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg: RGBA, bg: RGBA) {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

function toHex([r, g, b, a]: RGBA) {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const base = `#${h(r)}${h(g)}${h(b)}`;
  return a >= 0.999 ? base : `${base}${h(a * 255)}`;
}


// ---------- Live token snapshot — resolves against the page's current axes ----------
// A hidden probe lets us read the *used* color of any token (rgba, color-mix, …),
// re-read whenever data-theme / data-glass flips, so every swatch, value and badge
// on the page is the one currently in effect. No prose can do this; the DOM must.

type Snapshot = { colors: Record<string, RGBA>; hex: Record<string, string>; dims: Record<string, string> };

function useThemeSnapshot(colorTokens: string[], dimTokens: string[]): Snapshot {
  const [snap, setSnap] = useState<Snapshot>({ colors: {}, hex: {}, dims: {} });

  useEffect(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;left:-9999px;opacity:0;pointer-events:none;";
    document.body.appendChild(probe);


    const root = document.documentElement;

    function read() {
      const colors: Record<string, RGBA> = {};
      const hex: Record<string, string> = {};

      for (const name of colorTokens) {
        probe.style.color = "";
        probe.style.color = `var(${name})`;
        const rgba = parseRGB(getComputedStyle(probe).color);
        colors[name] = rgba;
        hex[name] = toHex(rgba);
      }

      const cs = getComputedStyle(root);
      const dims = Object.fromEntries(dimTokens.map(n => [n, cs.getPropertyValue(n).trim()]));
      setSnap({ colors, hex, dims });
    }


    read();

    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-glass"] });
    return () => {
      obs.disconnect();
      probe.remove();
    };
  }, [colorTokens.join(","), dimTokens.join(",")]);


  return snap;
}


// ---------- Copy — the swatch is the button (no extra chrome) ----------

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);


  function copy(name: string, value: string, wantValue: boolean) {
    navigator.clipboard?.writeText(wantValue ? value : `var(${name})`);
    setCopied(name);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1100);
  }


  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return { copied, copy };
}


// ---------- Contrast badge ----------

type Grade = "aaa" | "aa" | "aa-lg" | "fail";

function grade(r: number, large: boolean): Grade {
  if (r >= 7) return "aaa";
  if (r >= 4.5) return "aa";
  if (r >= 3) return large ? "aa" : "aa-lg";
  return "fail";
}

function Badge({ fg, bg, large }: { fg: RGBA; bg: RGBA; large?: boolean }) {
  if (!fg || !bg) return null;

  const r = ratio(fg, bg);
  const g = grade(r, !!large);
  return <span className={`tk-badge tk-${g}`}>{r.toFixed(1)}<i>{g === "aa-lg" ? "AA large" : g.toUpperCase()}</i></span>;
}


// ---------- Token chip — always-visible name, live value, click to copy ----------

type CopyFn = (name: string, value: string, wantValue: boolean) => void;

function Chip({
  name, snap, copied, copy, swatch, badge,
}: {
  name: string;
  snap: Snapshot;
  copied: string | null;
  copy: CopyFn;
  swatch?: boolean;
  badge?: ReactNode;
}) {
  const value = snap.hex[name] ?? snap.dims[name] ?? "";
  const isCopied = copied === name;


  return (
    <button
      type="button"
      className={`tk ${isCopied ? "tk-copied" : ""}`}
      style={swatch ? ({ "--sw": `var(${name})` } as CSSProperties) : undefined}
      onClick={e => copy(name, value, e.shiftKey || e.altKey)}
      title={`click → var(${name})   ·   ⇧click → ${value}`}
    >
      {swatch && <span className="tk-sw" />}
      <span className="tk-text">
        <code className="tk-name">{name}</code>
        {(value || isCopied) && <span className="tk-val">{isCopied ? "copied ✓" : value}</span>}
      </span>
      {badge}
    </button>
  );
}


// ---------- Tokens the section reads ----------

const COLOR_TOKENS = [
  "--base", "--glass-bg", "--frame", "--surface", "--surface-overlay",
  "--control-bg", "--control-hover", "--control-active", "--divider",
  "--text", "--text-dim", "--accent", "--accent-strong", "--accent-tint",
  "--danger", "--success",
  "--blue-3", "--blue-5", "--blue-8", "--blue-9",
  "--spectrum-orange", "--spectrum-amber", "--spectrum-pink",
  "--spectrum-teal", "--spectrum-blue", "--spectrum-violet",
];

const DIM_TOKENS = [
  "--radius-sm", "--radius-md", "--radius-lg", "--radius-pill",
  "--font-xs", "--font-sm", "--font-md", "--font-lg", "--font-xl", "--font-2xl", "--font-3xl",
  "--blur-sm", "--blur-md", "--blur-lg",
  "--shadow-sm", "--shadow-md", "--shadow-lg",
];


// A representative reading surface: the frosted stage a card's content sits on,
// composited frame → glass → base. Badges grade against this, worst-case-ish.
function stageOf(c: Record<string, RGBA>): RGBA {
  const base = c["--base"] ?? [0, 0, 0, 1];
  return over(c["--frame"] ?? [0, 0, 0, 0], over(c["--glass-bg"] ?? [0, 0, 0, 0], base));
}

function tintOver(color: RGBA, alpha: number, bg: RGBA): RGBA {
  return over([color[0], color[1], color[2], alpha], bg);
}


// ---------- Card shell — same language as the component demos ----------

function Card({
  label, span, tall, bodyClass, children,
}: {
  label: string;
  span?: 2 | 3;
  tall?: boolean;
  bodyClass?: string;
  children: ReactNode;
}) {
  return (
    <LiquidGlass className={`card tcard ${span ? `tcard-span-${span}` : ""}`} highlight>
      <div className={`tstage ${tall ? "tstage-tall" : ""} ${bodyClass ?? ""}`}>{children}</div>
      <div className="card-label">{label}</div>
    </LiquidGlass>
  );
}


// ---------- Block: Modes — the two orthogonal switches, shown not told ----------

const MODES: { theme: "dark" | "light"; glass: "dark" | "light" }[] = [
  { theme: "dark", glass: "dark" },
  { theme: "dark", glass: "light" },
  { theme: "light", glass: "dark" },
  { theme: "light", glass: "light" },
];

function ModeTile({ theme, glass }: { theme: "dark" | "light"; glass: "dark" | "light" }) {
  return (
    <div className="mode-tile" data-theme={theme} data-glass={glass}>
      <span className="mode-blob" />
      <LiquidGlass className="mode-card" highlight>
        <span className="mode-dot" />
        <span className="mode-bar mode-bar-text" />
        <code className="mode-tag">
          <span>data-theme="{theme}"</span>
          <span>data-glass="{glass}"</span>
        </code>
      </LiquidGlass>
    </div>
  );
}

function ModeMatrix() {
  return (
    <Card label="Modes" span={2} tall>
      <div className="mode-grid">
        {MODES.map(m => <ModeTile key={`${m.theme}-${m.glass}`} {...m} />)}
      </div>
    </Card>
  );
}


// ---------- Block: Color roles — the whole chromatic API ----------

const ACCENT_RAMP = ["--blue-3", "--blue-5", "--blue-8", "--blue-9"];

function ColorRoles({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  const c = snap.colors;
  const stage = stageOf(c);


  const accent = c["--accent"];
  const danger = c["--danger"];
  const success = c["--success"];


  return (
    <Card label="Color" span={2} bodyClass="stage-spread">
      <div className="tk-row">
        <Chip name="--accent" snap={snap} copied={copied} copy={copy} swatch
          badge={accent && <Badge fg={accent} bg={stage} large />} />
        <Chip name="--accent-strong" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--accent-tint" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--success" snap={snap} copied={copied} copy={copy} swatch
          badge={success && <Badge fg={success} bg={tintOver(success, 0.16, stage)} />} />
        <Chip name="--danger" snap={snap} copied={copied} copy={copy} swatch
          badge={danger && <Badge fg={danger} bg={tintOver(danger, 0.16, stage)} />} />
      </div>
      <div className="tk-applied">
        <Button variant="primary" tabIndex={-1}>Primary</Button>
        <Tag variant="success">Success</Tag>
        <Tag variant="danger">Danger</Tag>
        <a className="tk-link" href="#" tabIndex={-1} onClick={e => e.preventDefault()}>Link</a>
      </div>
      <div className="ramp">
        <span className="ramp-label">--accent draws from Open&nbsp;Color</span>
        {ACCENT_RAMP.map(name => {
          const active = !!snap.hex[name] && snap.hex[name] === snap.hex["--accent"];

          return (
            <button
              key={name}
              type="button"
              className={`ramp-cell ${active ? "ramp-active" : ""} ${copied === name ? "tk-copied" : ""}`}
              style={{ "--sw": `var(${name})` } as CSSProperties}
              onClick={e => copy(name, snap.hex[name] ?? "", e.shiftKey || e.altKey)}
              title={`click → var(${name})   ·   ⇧click → ${snap.hex[name] ?? ""}`}
            >
              <span className="ramp-sw" />
              <code>{copied === name ? "copied ✓" : active ? "= --accent" : name.replace("--", "")}</code>
            </button>
          );
        })}
      </div>
    </Card>
  );
}


// ---------- Block: Surfaces & text — fills, dividers, and the text ladder ----------

function SurfaceText({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  const c = snap.colors;
  const stage = stageOf(c);


  return (
    <Card label="Surfaces & text" span={2}>
      <span className="surface-field" />
      <div className="tk-row surface-row">
        <Chip name="--glass-bg" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--control-bg" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--control-hover" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--control-active" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--surface" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--divider" snap={snap} copied={copied} copy={copy} swatch />
      </div>
      <div className="text-ladder">
        <p className="text-full">
          The quick brown fox
          <Chip name="--text" snap={snap} copied={copied} copy={copy}
            badge={c["--text"] && <Badge fg={c["--text"]} bg={stage} />} />
        </p>
        <p className="text-dim">
          jumps over the lazy dog
          <Chip name="--text-dim" snap={snap} copied={copied} copy={copy}
            badge={c["--text-dim"] && <Badge fg={over(c["--text-dim"], stage)} bg={stage} />} />
        </p>
      </div>
    </Card>
  );
}


// ---------- Block: Glass anatomy — the surface is a stack, not a variable ----------

function GlassAnatomy({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Glass" tall>
      <span className="glass-field" />
      <div className="glass-demo">
        <LiquidGlass className="glass-sample" highlight />
      </div>
      <div className="tk-row glass-row">
        <Chip name="--glass-bg" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--blur-sm" snap={snap} copied={copied} copy={copy} />
        <Chip name="--shadow-sm" snap={snap} copied={copied} copy={copy} />
      </div>
    </Card>
  );
}


// ---------- Block: Radius ----------

const RADII = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-pill"];

function RadiusScale({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Radius">
      <ul className="radius-list">
        {RADII.map(name => (
          <li key={name}>
            <button
              type="button"
              className={`radius-item ${copied === name ? "tk-copied" : ""}`}
              onClick={e => copy(name, snap.dims[name] ?? "", e.shiftKey || e.altKey)}
              title={`click → var(${name})   ·   ⇧click → ${snap.dims[name] ?? ""}`}
            >
              <span className="radius-box" style={{ borderRadius: `var(${name})` }} />
              <code className="radius-name">{name}</code>
              <span className="radius-px">{copied === name ? "copied ✓" : snap.dims[name]}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}


// ---------- Block: Elevation — frost depth (blur) and lift (shadow) ----------

const BLURS = ["--blur-sm", "--blur-md", "--blur-lg"];
const SHADOWS = ["--shadow-sm", "--shadow-md", "--shadow-lg"];

function Elevation({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Elevation" span={2} tall>
      <span className="elev-field" />
      <div className="elev-row">
        {BLURS.map(name => (
          <button
            key={name}
            type="button"
            className={`elev-cell ${copied === name ? "tk-copied" : ""}`}
            style={{ backdropFilter: `blur(var(${name})) saturate(180%)`, WebkitBackdropFilter: `blur(var(${name})) saturate(180%)` } as CSSProperties}
            onClick={e => copy(name, snap.dims[name] ?? "", e.shiftKey || e.altKey)}
            title={`click → var(${name})   ·   ⇧click → ${snap.dims[name] ?? ""}`}
          >
            <code>{name}</code>
            <span className="elev-meta">{copied === name ? "copied ✓" : snap.dims[name]}</span>
          </button>
        ))}
      </div>
      <div className="elev-row">
        {SHADOWS.map(name => (
          <button
            key={name}
            type="button"
            className={`elev-cell shadow-cell ${copied === name ? "tk-copied" : ""}`}
            style={{ boxShadow: `var(${name})` }}
            onClick={e => copy(name, snap.dims[name] ?? "", e.shiftKey || e.altKey)}
            title={`click → var(${name})   ·   ⇧click → ${snap.dims[name] ?? ""}`}
          >
            <code>{name}</code>
            <span className="elev-meta elev-shadow-val">{copied === name ? "copied ✓" : snap.dims[name]}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}


// ---------- Block: Type ----------

const TYPE = [
  { name: "--font-3xl", word: "Aa" },
  { name: "--font-2xl", word: "Aa" },
  { name: "--font-xl", word: "The quick brown fox" },
  { name: "--font-lg", word: "The quick brown fox" },
  { name: "--font-md", word: "The quick brown fox jumps over" },
  { name: "--font-sm", word: "The quick brown fox jumps over the lazy dog" },
  { name: "--font-xs", word: "The quick brown fox jumps over the lazy dog" },
];

function TypeScale({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Type" span={2} tall>
      <ul className="type-list">
        {TYPE.map(({ name, word }) => (
          <li key={name}>
            <button
              type="button"
              className={`type-row ${copied === name ? "tk-copied" : ""}`}
              onClick={e => copy(name, snap.dims[name] ?? "", e.shiftKey || e.altKey)}
              title={`click → var(${name})`}
            >
              <span className="type-specimen" style={{ fontSize: `var(${name})` }}>{word}</span>
              <code className="type-tag">{name} <i>{copied === name ? "copied ✓" : snap.dims[name]}</i></code>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}


// ---------- Block: Spectrum — the prismatic field the glass floats over ----------

const SPECTRUM = [
  "--spectrum-orange", "--spectrum-amber", "--spectrum-pink",
  "--spectrum-teal", "--spectrum-blue", "--spectrum-violet",
];

function Spectrum({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <div className="spectrum">
      <span className="spectrum-label">Spectrum</span>
      <div className="spectrum-strip">
        {SPECTRUM.map(name => (
          <button
            key={name}
            type="button"
            className={`spectrum-cell ${copied === name ? "tk-copied" : ""}`}
            style={{ "--sw": `var(${name})` } as CSSProperties}
            onClick={e => copy(name, snap.hex[name] ?? "", e.shiftKey || e.altKey)}
            title={`click → var(${name})   ·   ⇧click → ${snap.hex[name] ?? ""}`}
          >
            <code>{copied === name ? "copied ✓" : name}</code>
            <span className="spectrum-hex">{snap.hex[name]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


// ---------- The section ----------

export function ThemeSection() {
  const snap = useThemeSnapshot(COLOR_TOKENS, DIM_TOKENS);
  const { copied, copy } = useCopy();


  return (
    <section className="theme-section" aria-label="Theme">
      <div className="theme-head">
        <h2 className="theme-title">Theme</h2>
        <span className="theme-hint">click to copy <code>var(--token)</code> · shift-click for its value</span>
      </div>
      <div className="grid theme-grid">
        <ModeMatrix />
        <ColorRoles snap={snap} copied={copied} copy={copy} />
        <SurfaceText snap={snap} copied={copied} copy={copy} />
        <GlassAnatomy snap={snap} copied={copied} copy={copy} />
        <RadiusScale snap={snap} copied={copied} copy={copy} />
        <Elevation snap={snap} copied={copied} copy={copy} />
        <TypeScale snap={snap} copied={copied} copy={copy} />
      </div>
      <Spectrum snap={snap} copied={copied} copy={copy} />
    </section>
  );
}
