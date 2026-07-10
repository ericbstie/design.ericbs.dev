import { createContext, useCallback, useContext, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { flushSync } from "react-dom";


const RouterContext = createContext<{ path: string; navigate: (to: string) => void }>({ path: "/", navigate: () => {} });

export function useRouter() {
  return useContext(RouterContext);
}

function transitionTo(update: () => void) {
  if (document.startViewTransition) document.startViewTransition(() => flushSync(update));
  else update();
}

export function Router({ children }: { children: (path: string) => React.ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;

    window.history.pushState(null, "", to);
    transitionTo(() => {
      setPath(to);
      window.scrollTo(0, 0);
    });
  }, []);

  useEffect(() => {
    function onPopState() {
      transitionTo(() => setPath(window.location.pathname));
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return <RouterContext.Provider value={{ path, navigate }}>{children(path)}</RouterContext.Provider>;
}


export function RouteLink({ to, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (e.currentTarget.target || e.currentTarget.hasAttribute("download")) return;

    e.preventDefault();
    navigate(to);
  }

  return <a href={to} onClick={handleClick} {...rest} />;
}
