import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Blobs,
  CursorStage,
  LiquidGlass,
  Noise,
  Ripple,
  ThemeToggle,
  type Theme,
} from "./components";
import "./index.css";

type RippleState = { id: number; x: number; y: number; theme: Theme };

function Card({ label, children, stage }: { label: string; children?: ReactNode; stage?: ReactNode }) {
  return (
    <LiquidGlass className="card">
      {stage ?? <div className="stage">{children}</div>}
      <div className="card-label">{label}</div>
    </LiquidGlass>
  );
}

export function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [glass, setGlass] = useState<Theme>("dark");
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const glassRef = useRef(glass);
  const ripplesRef = useRef(ripples);
  const idRef = useRef(0);
  ripplesRef.current = ripples;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.glass = glass;
  }, [glass]);

  const toggleTheme = (x: number, y: number) => {
    const next: Theme = glassRef.current === "dark" ? "light" : "dark";
    glassRef.current = next;
    setGlass(next);
    setRipples(r => [...r, { id: ++idRef.current, x, y, theme: next }]);
  };

  const onRippleEnd = (id: number) => {
    const rs = ripplesRef.current;
    const idx = rs.findIndex(r => r.id === id);
    if (idx === -1) return;
    const r = rs[idx]!;
    if (idx === rs.length - 1) {
      setTheme(r.theme);
      setRipples([]);
    } else if (idx === 0) {
      setTheme(r.theme);
      setRipples(rs.slice(1));
    }
  };

  return (
    <>
      <div className="page-bg">
        <Blobs style={{ mixBlendMode: "var(--blob-blend)" as never, opacity: "var(--blob-op)" as never }} />
      </div>
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} theme={r.theme} onEnd={() => onRippleEnd(r.id)} />
      ))}
      <main>
        <h1>Components</h1>
        <div className="grid">
          <Card label="Liquid glass">
            <Blobs />
            <LiquidGlass className="pill">
              <Noise />
            </LiquidGlass>
          </Card>
          <Card
            label="Rim"
            stage={
              <div className="stage stage-split">
                <div className="half" style={{ background: "#131310" }}>
                  <div className="chip">
                    <div className="rim rim-white" style={{ opacity: 1 }} />
                  </div>
                </div>
                <div className="half" style={{ background: "#eeeae4" }}>
                  <div className="chip">
                    <div className="rim rim-black" style={{ opacity: 1 }} />
                  </div>
                </div>
              </div>
            }
          />
          <Card label="Blobs">
            <Blobs />
          </Card>
          <Card label="Noise">
            <div className="noise-swatch" />
          </Card>
          <Card label="Theme toggle">
            <ThemeToggle glass={glass} onToggle={toggleTheme} />
          </Card>
          <Card label="Cursor" stage={<CursorStage glass={glass} onToggle={toggleTheme} />} />
        </div>
      </main>
    </>
  );
}
