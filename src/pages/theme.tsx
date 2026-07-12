import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { LiquidGlass } from "../components";
import { Button, Link, Progress, Tag } from "../ui";
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
];

const DIM_TOKENS = [
  "--radius",
  "--font-xs", "--font-sm", "--font-md", "--font-xl", "--font-3xl",
  "--blur-sm", "--shadow-sm",
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
  span?: 2 | 4;
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


// ---------- Block: Color — one accent family + status, each shade shown in use ----------

function noNav(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

function RoleRow({
  name, use, snap, copied, copy, badge, children,
}: {
  name: string;
  use: string;
  snap: Snapshot;
  copied: string | null;
  copy: CopyFn;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="role-row">
      <Chip name={name} snap={snap} copied={copied} copy={copy} swatch badge={badge} />
      <span className="role-use">{use}</span>
      <span className="role-demo">{children}</span>
    </div>
  );
}

function ColorRoles({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  const c = snap.colors;
  const stage = stageOf(c);


  const accent = c["--accent"];
  const danger = c["--danger"];
  const success = c["--success"];


  return (
    <Card label="Color" span={2} bodyClass="stage-roles">
      <RoleRow name="--accent" use="links · focus · selected" snap={snap} copied={copied} copy={copy}
        badge={accent && <Badge fg={accent} bg={stage} large />}>
        <Link href="#" tabIndex={-1} onClick={noNav}>Link</Link>
      </RoleRow>
      <RoleRow name="--accent-strong" use="progress · emphasis" snap={snap} copied={copied} copy={copy}>
        <span className="role-progress"><Progress value={62} /></span>
      </RoleRow>
      <RoleRow name="--accent-tint" use="primary fill · selection" snap={snap} copied={copied} copy={copy}>
        <Button variant="primary" size="sm" tabIndex={-1}>Primary</Button>
      </RoleRow>
      <hr className="role-divider" />
      <RoleRow name="--success" use="positive" snap={snap} copied={copied} copy={copy}
        badge={success && <Badge fg={success} bg={tintOver(success, 0.16, stage)} />}>
        <Tag variant="success">Saved</Tag>
      </RoleRow>
      <RoleRow name="--danger" use="errors · destructive" snap={snap} copied={copied} copy={copy}
        badge={danger && <Badge fg={danger} bg={tintOver(danger, 0.16, stage)} />}>
        <Tag variant="danger">Failed</Tag>
      </RoleRow>
    </Card>
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


// ---------- Block: Glass — the material recipe: fill · blur · radius · shadow ----------

function GlassRecipe({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Glass" span={2}>
      <span className="glass-field" />
      <div className="glass-demo">
        <LiquidGlass className="glass-sample" highlight />
      </div>
      <div className="tk-row glass-row">
        <Chip name="--glass-bg" snap={snap} copied={copied} copy={copy} swatch />
        <Chip name="--blur-sm" snap={snap} copied={copied} copy={copy} />
        <Chip name="--radius" snap={snap} copied={copied} copy={copy} />
        <Chip name="--shadow-sm" snap={snap} copied={copied} copy={copy} />
      </div>
    </Card>
  );
}


// ---------- Block: Type ----------

const TYPE = [
  { name: "--font-3xl", word: "Aa" },
  { name: "--font-xl", word: "The quick brown fox" },
  { name: "--font-md", word: "The quick brown fox jumps over" },
  { name: "--font-sm", word: "The quick brown fox jumps over the lazy dog" },
  { name: "--font-xs", word: "The quick brown fox jumps over the lazy dog" },
];

function TypeScale({ snap, copied, copy }: { snap: Snapshot; copied: string | null; copy: CopyFn }) {
  return (
    <Card label="Type" span={4}>
      <ul className="type-list">
        {TYPE.map(({ name, word }) => (
          <li key={name}>
            <button
              type="button"
              className={`type-row ${copied === name ? "tk-copied" : ""}`}
              onClick={e => copy(name, snap.dims[name] ?? "", e.shiftKey || e.altKey)}
              title={`click → var(${name})   ·   ⇧click → ${snap.dims[name] ?? ""}`}
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


// ---------- The section ----------

export function ThemeSection() {
  const snap = useThemeSnapshot(COLOR_TOKENS, DIM_TOKENS);
  const { copied, copy } = useCopy();


  return (
    <section className="theme-section" aria-label="Theme">
      <div className="block-head">
        <h2 className="block-title">Theme</h2>
        <span className="theme-hint">click to copy <code>var(--token)</code> · shift-click for its value</span>
      </div>
      <div className="grid theme-grid">
        <ColorRoles snap={snap} copied={copied} copy={copy} />
        <ModeMatrix />
        <SurfaceText snap={snap} copied={copied} copy={copy} />
        <GlassRecipe snap={snap} copied={copied} copy={copy} />
        <TypeScale snap={snap} copied={copied} copy={copy} />
      </div>
    </section>
  );
}
