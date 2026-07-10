import { useEffect, useRef, useState } from "react";
import { Blobs, Ripple, SiteCursor, ThemeToggle, type Theme } from "./components";
import { ToastProvider } from "./ui";
import { Router, RouteLink } from "./router";
import { Docs } from "./pages/Docs";
import { Sample1 } from "./pages/Sample1";
import { Sample2 } from "./pages/Sample2";
import { Sample3 } from "./pages/Sample3";
import "./index.css";


type RippleState = { id: number; x: number; y: number; theme: Theme };

const TITLES: Record<string, string> = {
  "/": "Components",
  "/sample/1": "Prism",
  "/sample/2": "Pipelines",
  "/sample/3": "Aurora",
};


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

  function renderPage(path: string) {
    if (path === "/sample/1") return <Sample1 />;
    if (path === "/sample/2") return <Sample2 />;
    if (path === "/sample/3") return <Sample3 />;
    return <Docs glass={glass} onToggle={toggleTheme} />;
  }

  return (
    <ToastProvider>
      <div className="page-bg">
        <Blobs />
      </div>
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} theme={r.theme} onEnd={() => onRippleEnd(r)} />
      ))}
      <Router>
        {path => (
          <main>
            <header>
              <h1>{path === "/" ? "Components" : <RouteLink to="/" className="home-link">{TITLES[path] ?? "Components"}</RouteLink>}</h1>
              <nav className="top-nav" aria-label="Samples">
                <RouteLink to="/sample/1" aria-current={path === "/sample/1" ? "page" : undefined}>1</RouteLink>
                <RouteLink to="/sample/2" aria-current={path === "/sample/2" ? "page" : undefined}>2</RouteLink>
                <RouteLink to="/sample/3" aria-current={path === "/sample/3" ? "page" : undefined}>3</RouteLink>
                <ThemeToggle glass={glass} onToggle={toggleTheme} />
              </nav>
            </header>
            {renderPage(path)}
          </main>
        )}
      </Router>
      <SiteCursor />
    </ToastProvider>
  );
}
