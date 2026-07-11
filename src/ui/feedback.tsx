import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePresence } from "./presence";


export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const { present, status } = usePresence(open, bubbleRef);


  return (
    <span
      className="ui-tooltip-anchor"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {present && (
        <span ref={bubbleRef} className="ui-tooltip" role="tooltip" data-state={status}>{label}</span>
      )}
    </span>
  );
}


export type ToastVariant = "default" | "success" | "danger";

type ToastItem = { id: number; message: ReactNode; variant: ToastVariant; open: boolean };

const ToastContext = createContext<(message: ReactNode, variant?: ToastVariant) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}


function ToastRow({ item, onExited }: { item: ToastItem; onExited: (id: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { present, status } = usePresence(item.open, ref);


  useEffect(() => {
    if (!present) onExited(item.id);
  }, [present, item.id, onExited]);


  if (!present) return null;


  return (
    <div ref={ref} className="ui-toast" data-state={status}>
      <span className={`ui-toast-dot ${item.variant === "default" ? "" : `ui-toast-dot-${item.variant}`}`} aria-hidden="true" />
      {item.message}
    </div>
  );
}


export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: ReactNode, variant: ToastVariant = "default") => {
    const id = ++idRef.current;

    setToasts(t => [...t, { id, message, variant, open: true }]);
    setTimeout(() => setToasts(t => t.map(x => (x.id === id ? { ...x, open: false } : x))), 4000);
  }, []);


  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);


  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="ui-toaster" role="status" aria-live="polite">
        {toasts.map(t => (
          <ToastRow key={t.id} item={t} onExited={remove} />
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
