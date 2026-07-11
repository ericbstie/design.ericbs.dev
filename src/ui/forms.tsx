import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Button, Label, Tag } from "./primitives";


export function Field({ label, hint, error, children, htmlFor }: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="ui-field">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <p className="ui-hint ui-hint-error" role="alert">{error}</p>}
      {!error && hint && <p className="ui-hint">{hint}</p>}
    </div>
  );
}


export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`ui-control ${className}`} {...rest} />;
}

export function TextArea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`ui-control ${className}`} {...rest} />;
}


export function Form({ children, onSubmit, ...rest }: FormHTMLAttributes<HTMLFormElement>) {
  function handleSubmit(e: Parameters<NonNullable<typeof onSubmit>>[0]) {
    e.preventDefault();
    onSubmit?.(e);
  }

  return <form className="ui-form" onSubmit={handleSubmit} {...rest}>{children}</form>;
}


function usePopover(onClose: () => void) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return { anchorRef, popoverRef };
}


// Portaled to <body> so the popover escapes the transformed .liquid-glass cards;
// only outside those does its backdrop-filter frost the real page behind it.
function Popover({ anchorRef, popoverRef, className = "", role, label, children }: {
  anchorRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  className?: string;
  role?: string;
  label?: string;
  children: ReactNode;
}) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const r = anchor.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef]);


  if (!rect) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`ui-popover ${className}`}
      role={role}
      aria-label={label}
      style={{ position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width }}
    >
      {children}
    </div>,
    document.body,
  );
}

function Chevron() {
  return (
    <svg className="ui-select-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 5.5L7 9l3.5-3.5" />
    </svg>
  );
}

function CheckMark({ visible }: { visible: boolean }) {
  return (
    <span className="ui-option-check" aria-hidden="true">
      {visible && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5L4.8 9.5 10 3" /></svg>
      )}
    </span>
  );
}


export type SelectOption = { value: string; label: ReactNode };

function useListNav(count: number, onPick: (index: number) => void, onClose: () => void) {
  const [active, setActive] = useState(-1);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") setActive(a => Math.min(a + 1, count - 1));
    else if (e.key === "ArrowUp") setActive(a => Math.max(a - 1, 0));
    else if (e.key === "Enter" && active >= 0) onPick(active);
    else if (e.key === "Escape" || e.key === "Tab") onClose();
    else return;

    if (e.key !== "Tab") e.preventDefault();
  }

  return { active, setActive, onKeyDown };
}

export function Select({ options, value, onChange, placeholder = "Select…", id }: {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = usePopover(() => setOpen(false));
  const listId = useId();

  function pick(i: number) {
    onChange(options[i]!.value);
    setOpen(false);
  }

  const nav = useListNav(options.length, pick, () => setOpen(false));
  const selected = options.find(o => o.value === value);

  return (
    <div className="ui-popover-anchor" ref={anchorRef}>
      <button
        id={id}
        type="button"
        className="ui-control ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && nav.active >= 0 ? `${listId}-${nav.active}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={open ? nav.onKeyDown : undefined}
      >
        <span className={`ui-select-value ${selected ? "" : "ui-select-placeholder"}`}>{selected?.label ?? placeholder}</span>
        <Chevron />
      </button>
      {open && (
        <Popover anchorRef={anchorRef} popoverRef={popoverRef}>
          <ul className="ui-listbox" role="listbox" id={listId}>
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                className="ui-option"
                role="option"
                aria-selected={o.value === value}
                data-active={i === nav.active}
                onPointerEnter={() => nav.setActive(i)}
                onClick={() => pick(i)}
              >
                <CheckMark visible={o.value === value} />
                {o.label}
              </li>
            ))}
          </ul>
        </Popover>
      )}
    </div>
  );
}


export function MultiSelect({ options, value, onChange, placeholder = "Select…", id }: {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = usePopover(() => setOpen(false));
  const listId = useId();

  function toggleValue(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  }

  const nav = useListNav(options.length, i => toggleValue(options[i]!.value), () => setOpen(false));
  const selected = options.filter(o => value.includes(o.value));

  return (
    <div className="ui-popover-anchor" ref={anchorRef}>
      <button
        id={id}
        type="button"
        className="ui-control ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && nav.active >= 0 ? `${listId}-${nav.active}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={open ? nav.onKeyDown : undefined}
      >
        {selected.length === 0
          ? <span className="ui-select-value ui-select-placeholder">{placeholder}</span>
          : (
            <span className="ui-multiselect-tags">
              {selected.map(o => (
                <Tag key={o.value} variant="accent">{o.label}</Tag>
              ))}
            </span>
          )}
        <Chevron />
      </button>
      {open && (
        <Popover anchorRef={anchorRef} popoverRef={popoverRef}>
          <ul className="ui-listbox" role="listbox" aria-multiselectable="true" id={listId}>
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                className="ui-option"
                role="option"
                aria-selected={value.includes(o.value)}
                data-active={i === nav.active}
                onPointerEnter={() => nav.setActive(i)}
                onClick={() => toggleValue(o.value)}
              >
                <CheckMark visible={value.includes(o.value)} />
                {o.label}
              </li>
            ))}
          </ul>
        </Popover>
      )}
    </div>
  );
}


export function RadioGroup({ legend, options, value, onChange, name }: {
  legend: ReactNode;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  name?: string;
}) {
  const fallbackName = useId();

  return (
    <fieldset className="ui-radio-group">
      <legend>{legend}</legend>
      {options.map(o => (
        <label key={o.value} className="ui-radio">
          <input
            type="radio"
            name={name ?? fallbackName}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}


export function FileUpload({ label = "Drop files here or click to browse", multiple, onFiles, id }: {
  label?: ReactNode;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;

    const next = multiple ? [...files, ...list] : [list[0]!];
    setFiles(next);
    onFiles?.(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);

    setFiles(next);
    onFiles?.(next);
  }

  return (
    <div>
      <button
        id={id}
        type="button"
        className="ui-fileupload"
        data-drag={drag}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 15V4M6.5 8.5L11 4l4.5 4.5M4 15v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
        <span className="ui-fileupload-title">{label}</span>
        <span>{multiple ? "Multiple files supported" : "Single file"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        hidden
        onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
      />
      {files.length > 0 && (
        <ul className="ui-fileupload-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <Tag variant="accent" onRemove={() => removeFile(i)} removeLabel={`Remove ${f.name}`}>{f.name}</Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DOWS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", id }: {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => value ?? new Date());
  const { anchorRef, popoverRef } = usePopover(() => setOpen(false));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function pick(day: number) {
    onChange(new Date(year, month, day));
    setOpen(false);
  }

  function isSelected(day: number) {
    return value?.getFullYear() === year && value?.getMonth() === month && value?.getDate() === day;
  }

  return (
    <div className="ui-popover-anchor" ref={anchorRef}>
      <button id={id} type="button" className="ui-control ui-select-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={`ui-select-value ${value ? "" : "ui-select-placeholder"}`}>{value ? formatDate(value) : placeholder}</span>
        <Chevron />
      </button>
      {open && (
        <Popover anchorRef={anchorRef} popoverRef={popoverRef} className="ui-calendar" role="dialog" label="Choose date">
          <div className="ui-calendar-head">
            <button type="button" className="ui-calendar-nav" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>‹</button>
            <span className="ui-calendar-month">{MONTHS[month]} {year}</span>
            <button type="button" className="ui-calendar-nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="ui-calendar-grid">
            {DOWS.map(d => <span key={d} className="ui-calendar-dow" aria-hidden="true">{d}</span>)}
            {Array.from({ length: firstDow }, (_, i) => <button key={`pad-${i}`} type="button" className="ui-calendar-day" disabled aria-hidden="true" />)}
            {Array.from({ length: daysInMonth }, (_, i) => (
              <button key={i + 1} type="button" className="ui-calendar-day" aria-pressed={isSelected(i + 1)} onClick={() => pick(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </div>
  );
}


function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function TimePicker({ value, onChange, placeholder = "Pick a time", minuteStep = 5, id }: {
  value: string | null;
  onChange: (time: string) => void;
  placeholder?: string;
  minuteStep?: number;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const { anchorRef, popoverRef } = usePopover(() => setOpen(false));

  const [hour, minute] = value ? value.split(":").map(Number) : [null, null];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);

  function pickHour(h: number) {
    onChange(`${pad2(h)}:${pad2(minute ?? 0)}`);
  }

  function pickMinute(m: number) {
    onChange(`${pad2(hour ?? 0)}:${pad2(m)}`);
    setOpen(false);
  }

  return (
    <div className="ui-popover-anchor" ref={anchorRef}>
      <button id={id} type="button" className="ui-control ui-select-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={`ui-select-value ${value ? "" : "ui-select-placeholder"}`}>{value ?? placeholder}</span>
        <Chevron />
      </button>
      {open && (
        <Popover anchorRef={anchorRef} popoverRef={popoverRef} className="ui-timepicker" role="dialog" label="Choose time">
          <div className="ui-time-col" aria-label="Hours">
            {hours.map(h => (
              <button key={h} type="button" className="ui-time-cell" aria-pressed={h === hour} onClick={() => pickHour(h)}>{pad2(h)}</button>
            ))}
          </div>
          <div className="ui-time-col" aria-label="Minutes">
            {minutes.map(m => (
              <button key={m} type="button" className="ui-time-cell" aria-pressed={m === minute} onClick={() => pickMinute(m)}>{pad2(m)}</button>
            ))}
          </div>
        </Popover>
      )}
    </div>
  );
}
