import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";


export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="ui-tooltip-anchor"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && <span className="ui-tooltip" role="tooltip">{label}</span>}
    </span>
  );
}


export type ToastVariant = "default" | "success" | "danger";

type ToastItem = { id: number; message: ReactNode; variant: ToastVariant };

const ToastContext = createContext<(message: ReactNode, variant?: ToastVariant) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: ReactNode, variant: ToastVariant = "default") => {
    const id = ++idRef.current;

    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="ui-toaster" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="ui-toast">
            <span className={`ui-toast-dot ${t.variant === "default" ? "" : `ui-toast-dot-${t.variant}`}`} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


export function Progress({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="ui-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label ?? "Progress"}>
      <div className="ui-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}


export function Skeleton({ width, height = 14, radius, style }: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  style?: CSSProperties;
}) {
  return <div className="ui-skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}


export function ChatShimmer({ label = "Thinking…", lines = 3 }: { label?: string; lines?: number }) {
  const widths = ["100%", "92%", "64%", "80%", "48%"];

  return (
    <div className="ui-chat-shimmer" role="status" aria-label={label}>
      <span className="ui-shimmer-avatar" aria-hidden="true" />
      <div className="ui-shimmer-body">
        <span className="ui-shimmer-label" aria-hidden="true">{label}</span>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="ui-shimmer-line" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>
    </div>
  );
}
