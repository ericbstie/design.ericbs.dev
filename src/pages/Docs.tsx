import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { GlassCursor, LiquidGlass, type Theme, type ToggleFn } from "../components";
import {
  Breadcrumb, Button, Card, ChatShimmer, DatePicker, FileUpload, Field, Form, Input, Label, Link,
  MultiSelect, Progress, RadioGroup, Select, Skeleton, Table, Tag, TextArea, TimePicker, Timeline,
  Toggle, Tooltip, Tree, useToast,
} from "../ui";


const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

function focusablesIn(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
}

function lockFocus(root: HTMLElement) {
  for (const el of focusablesIn(root)) {
    if (el.dataset.demoTabindex === undefined) el.dataset.demoTabindex = el.getAttribute("tabindex") ?? "none";
    el.tabIndex = -1;
  }
}

function unlockFocus(root: HTMLElement) {
  for (const el of focusablesIn(root)) {
    const original = el.dataset.demoTabindex;
    if (original === undefined) continue;

    if (original === "none") el.removeAttribute("tabindex");
    else el.setAttribute("tabindex", original);

    delete el.dataset.demoTabindex;
  }
}


function Demo({ label, children }: { label: string; children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && !entered && e.target === cardRef.current) setEntered(true);

    if (e.key === "Escape" && entered) {
      setEntered(false);
      cardRef.current?.focus();
    }
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (entered && !cardRef.current?.contains(e.relatedTarget)) setEntered(false);
  }

  useEffect(() => {
    const card = cardRef.current!;

    if (entered) {
      unlockFocus(card);
      focusablesIn(card)[0]?.focus();
      return;
    }

    lockFocus(card);

    const observer = new MutationObserver(() => lockFocus(card));
    observer.observe(card, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [entered]);

  return (
    <LiquidGlass
      ref={cardRef}
      className="card"
      highlight
      role="group"
      tabIndex={0}
      aria-label={`${label} demo — press Enter to interact, Escape to leave`}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <div className="card-title">{label}</div>
      <div className="demo-stage">{children}</div>
    </LiquidGlass>
  );
}


function ButtonDemo() {
  return (
    <div className="demo-row">
      <Button variant="primary">Primary</Button>
      <Button>Default</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}

function CardDemo() {
  return (
    <Card title="Glass card" subtitle="A frosted surface for content.">
      <Tag variant="accent">Nested content</Tag>
    </Card>
  );
}

function InputDemo() {
  const [value, setValue] = useState("");

  return (
    <Field label="Name" htmlFor="demo-input" hint="Shown on your public profile.">
      <Input id="demo-input" value={value} placeholder="Ada Lovelace" onChange={e => setValue(e.target.value)} />
    </Field>
  );
}

function TextAreaDemo() {
  return (
    <Field label="Message" htmlFor="demo-textarea">
      <TextArea id="demo-textarea" placeholder="Write something…" rows={3} />
    </Field>
  );
}

const FRUIT = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
  { value: "plum", label: "Plum" },
  { value: "cherry", label: "Cherry" },
];

function SelectDemo() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Field label="Fruit" htmlFor="demo-select">
      <Select id="demo-select" options={FRUIT} value={value} onChange={setValue} />
    </Field>
  );
}

function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>(["apple"]);

  return (
    <Field label="Fruits" htmlFor="demo-multiselect">
      <MultiSelect id="demo-multiselect" options={FRUIT} value={value} onChange={setValue} />
    </Field>
  );
}

function LabelDemo() {
  return (
    <div>
      <Label htmlFor="demo-labelled">Email address</Label>
      <Input id="demo-labelled" type="email" placeholder="you@example.com" />
    </div>
  );
}

function TagDemo() {
  const [removed, setRemoved] = useState(false);

  return (
    <div className="demo-row">
      <Tag>Default</Tag>
      <Tag variant="accent">Accent</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="danger">Danger</Tag>
      {!removed && <Tag variant="accent" onRemove={() => setRemoved(true)}>Removable</Tag>}
    </div>
  );
}

function TooltipDemo() {
  return (
    <Tooltip label="Tooltips appear on hover and focus">
      <Button>Hover me</Button>
    </Tooltip>
  );
}

function ToastDemo() {
  const toast = useToast();

  return (
    <div className="demo-row">
      <Button variant="primary" onClick={() => toast("Saved successfully", "success")}>Success</Button>
      <Button onClick={() => toast("Something went wrong", "danger")}>Error</Button>
    </div>
  );
}

function ProgressDemo() {
  const [value, setValue] = useState(35);

  return (
    <div className="demo-col">
      <Progress value={value} label="Upload progress" />
      <Button size="sm" onClick={() => setValue(v => (v >= 100 ? 0 : v + 25))}>Advance</Button>
    </div>
  );
}

function TableDemo() {
  return (
    <Table
      columns={["Name", "Role", "Status"]}
      rows={[
        ["Ada", "Engineer", <Tag key="t" variant="success">Active</Tag>],
        ["Grace", "Admiral", <Tag key="t" variant="accent">Away</Tag>],
        ["Alan", "Analyst", <Tag key="t">Offline</Tag>],
      ]}
    />
  );
}

function SkeletonDemo() {
  return (
    <div className="demo-col">
      <Skeleton width="45%" />
      <Skeleton />
      <Skeleton width="80%" />
      <Skeleton width="60%" height={40} radius={12} />
    </div>
  );
}

function TimePickerDemo() {
  const [value, setValue] = useState<string | null>("09:30");

  return (
    <Field label="Time" htmlFor="demo-time">
      <TimePicker id="demo-time" value={value} onChange={setValue} />
    </Field>
  );
}

function DatePickerDemo() {
  const [value, setValue] = useState<Date | null>(null);

  return (
    <Field label="Date" htmlFor="demo-date">
      <DatePicker id="demo-date" value={value} onChange={setValue} />
    </Field>
  );
}

function ToggleDemo() {
  const [on, setOn] = useState(true);

  return <Toggle checked={on} onChange={setOn} label={on ? "Notifications on" : "Notifications off"} />;
}

function RadioGroupDemo() {
  const [value, setValue] = useState<string | null>("system");

  return (
    <RadioGroup
      legend="Appearance"
      value={value}
      onChange={setValue}
      options={[
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}

function FormDemo() {
  const toast = useToast();
  const [email, setEmail] = useState("");

  return (
    <Form onSubmit={() => toast(`Subscribed ${email || "you"}!`, "success")}>
      <Field label="Email" htmlFor="demo-form-email">
        <Input id="demo-form-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </Field>
      <div className="ui-form-actions">
        <Button type="submit" variant="primary">Subscribe</Button>
        <Button type="reset" variant="ghost" onClick={() => setEmail("")}>Clear</Button>
      </div>
    </Form>
  );
}

function FileUploadDemo() {
  return <FileUpload multiple />;
}

function TimelineDemo() {
  return (
    <Timeline
      items={[
        { title: "Order placed", meta: "Mon 09:12" },
        { title: "Shipped", meta: "Tue 14:03" },
        { title: "Out for delivery", meta: "Wed 08:41" },
      ]}
    />
  );
}

function TreeDemo() {
  return (
    <Tree
      label="Files"
      nodes={[
        {
          label: "src",
          children: [
            { label: "ui", children: [{ label: "primitives.tsx" }, { label: "forms.tsx" }] },
            { label: "App.tsx" },
          ],
        },
        { label: "package.json" },
      ]}
    />
  );
}

function BreadcrumbDemo() {
  return <Breadcrumb items={[{ label: "Home", href: "#" }, { label: "Library", href: "#" }, { label: "Data" }]} />;
}

function LinkDemo() {
  return (
    <p className="demo-text">
      Read the <Link href="#">documentation</Link> or explore the <Link href="#">source code</Link>.
    </p>
  );
}

function ChatShimmerDemo() {
  return <ChatShimmer />;
}


const DEMOS: { name: string; render: (glass: Theme, onToggle: ToggleFn) => ReactNode }[] = [
  { name: "Button", render: () => <ButtonDemo /> },
  { name: "Card", render: () => <CardDemo /> },
  { name: "Input", render: () => <InputDemo /> },
  { name: "Text area", render: () => <TextAreaDemo /> },
  { name: "Select", render: () => <SelectDemo /> },
  { name: "Multiselect", render: () => <MultiSelectDemo /> },
  { name: "Label", render: () => <LabelDemo /> },
  { name: "Tag", render: () => <TagDemo /> },
  { name: "Tooltip", render: () => <TooltipDemo /> },
  { name: "Toast", render: () => <ToastDemo /> },
  { name: "Progress", render: () => <ProgressDemo /> },
  { name: "Table", render: () => <TableDemo /> },
  { name: "Skeleton", render: () => <SkeletonDemo /> },
  { name: "Time picker", render: () => <TimePickerDemo /> },
  { name: "Date picker", render: () => <DatePickerDemo /> },
  { name: "Toggle", render: () => <ToggleDemo /> },
  { name: "Radio group", render: () => <RadioGroupDemo /> },
  { name: "Form", render: () => <FormDemo /> },
  { name: "File upload", render: () => <FileUploadDemo /> },
  { name: "Timeline", render: () => <TimelineDemo /> },
  { name: "Tree", render: () => <TreeDemo /> },
  { name: "Breadcrumb", render: () => <BreadcrumbDemo /> },
  { name: "Link", render: () => <LinkDemo /> },
  { name: "Chat shimmer", render: () => <ChatShimmerDemo /> },
  { name: "Glass cursor", render: () => <GlassCursor /> },
];


export function Docs({ glass, onToggle }: { glass: Theme; onToggle: ToggleFn }) {
  const [query, setQuery] = useState("");

  const visible = DEMOS.filter(d => d.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <div className="docs-intro">
        <Input
          type="search"
          name="component-search"
          aria-label="Search components"
          placeholder={`Search ${DEMOS.length} components…`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="docs-search"
        />
      </div>
      <div className="grid">
        {visible.map(d => (
          <Demo key={d.name} label={d.name}>
            {d.render(glass, onToggle)}
          </Demo>
        ))}
      </div>
      {visible.length === 0 && <p className="docs-empty">No components match “{query}”.</p>}
    </>
  );
}
