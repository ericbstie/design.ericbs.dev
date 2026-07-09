import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Blobs, CursorStage, LiquidGlass, Noise, Ripple, ThemeToggle, type Theme } from "./components";
import "./index.css";


type RippleState = { id: number; x: number; y: number; theme: Theme };

const pageBlobStyle: CSSProperties = { mixBlendMode: "var(--blob-blend)" as never, opacity: "var(--blob-op)" };


function Card({ label, children, stage }: { label: string; children?: ReactNode; stage?: ReactNode }) {
  return (
    <LiquidGlass className="card">
      {stage ?? <div className="stage">{children}</div>}
      <div className="card-label">{label}</div>
    </LiquidGlass>
  );
}

function RimHalf({ base, rim }: { base: string; rim: "rim-white" | "rim-black" }) {
  return (
    <div className="half" style={{ background: base }}>
      <div className="chip">
        <div className={`rim ${rim}`} style={{ opacity: 1 }} />
      </div>
    </div>
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
        <Blobs style={pageBlobStyle} />
      </div>
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} theme={r.theme} onEnd={() => onRippleEnd(r)} />
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
              <div className="stage">
                <RimHalf base="#131310" rim="rim-white" />
                <RimHalf base="#eeeae4" rim="rim-black" />
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
