import { useId, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { LiquidGlass, Rim } from "../components";


export function Card({ title, subtitle, className = "", style, children }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <LiquidGlass className={`ui-card ${className}`} style={style} highlight>
      {title && <h3 className="ui-card-title">{title}</h3>}
      {subtitle && <p className="ui-card-sub">{subtitle}</p>}
      {children}
    </LiquidGlass>
  );
}


export type ButtonVariant = "default" | "primary" | "ghost";

export function Button({ variant = "default", size, className = "", children, ...rest }: {
  variant?: ButtonVariant;
  size?: "sm";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantClass = variant === "default" ? "" : `ui-btn-${variant}`;

  return (
    <button
      className={`ui-btn ${variantClass} ${size === "sm" ? "ui-btn-sm" : ""} ${className}`}
      data-glass-highlight={variant === "ghost" ? undefined : ""}
      {...rest}
    >
      {variant !== "ghost" && <Rim />}
      {children}
    </button>
  );
}


export function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  const id = useId();

  return (
    <span className="ui-toggle-row">
      <button id={id} className="ui-toggle" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} data-glass-highlight="">
        <Rim />
        <span className="ui-toggle-thumb" />
      </button>
      <label htmlFor={id}>{label}</label>
    </span>
  );
}


export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return <label className="ui-label" htmlFor={htmlFor}>{children}</label>;
}


export type TagVariant = "default" | "accent" | "success" | "danger";

export function Tag({ variant = "default", onRemove, removeLabel = "Remove", children }: {
  variant?: TagVariant;
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}) {
  return (
    <span className={`ui-tag ${variant === "default" ? "" : `ui-tag-${variant}`}`}>
      {children}
      {onRemove && (
        <button className="ui-tag-remove" aria-label={removeLabel} onClick={onRemove}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg>
        </button>
      )}
    </span>
  );
}


export function Link({ className = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`ui-link ${className}`} {...rest}>{children}</a>;
}


export function Breadcrumb({ items }: { items: { label: ReactNode; href?: string }[] }) {
  return (
    <nav className="ui-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;

          return (
            <li key={i}>
              {last
                ? <span aria-current="page">{item.label}</span>
                : <Link href={item.href ?? "#"}>{item.label}</Link>}
              {!last && <span className="ui-breadcrumb-sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
