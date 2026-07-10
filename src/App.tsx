import { useEffect, useRef, useState, type ReactNode } from "react";
import { Blobs, Button, GlassCursor, LiquidGlass, Ripple, ThemeToggle, type Theme } from "./components";
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
  const idRef = useRef(0);

  function toggleTheme(x: number, y: number) {
    const next: Theme = glass === "dark" ? "light" : "dark";

    setGlass(next);
    setRipples(r => [...r, { id: ++idRef.current, x, y, theme: next }]);
  }

  function onRippleEnd(ended: RippleState) {
    const newest = ripples[ripples.length - 1] === ended;
    if (!newest && ripples[0] !== ended) return;

    setTheme(ended.theme);
    setRipples(newest ? [] : ripples.slice(1));
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.glass = glass;
  }, [theme, glass]);

  return (
    <>
      <div className="page-bg">
        <Blobs />
      </div>
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} theme={r.theme} onEnd={() => onRippleEnd(r)} />
      ))}
      <main>
        <header>
          <h1>Components</h1>
          <ThemeToggle glass={glass} onToggle={toggleTheme} />
        </header>
        <div className="grid">
          <Card label="Button">
            <Button>Button</Button>
          </Card>
          <Card label="GlassCursor" stage={<GlassCursor glass={glass} onToggle={toggleTheme} />} />
        </div>
      </main>
    </>
  );
}
