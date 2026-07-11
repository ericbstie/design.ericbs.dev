import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";


export function Table({ columns, rows }: { columns: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>{columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export type TimelineItem = { title: ReactNode; meta?: ReactNode };

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="ui-timeline">
      {items.map((item, i) => (
        <li key={i}>
          <span className="ui-timeline-dot" aria-hidden="true" />
          <div className="ui-timeline-title">{item.title}</div>
          {item.meta && <div className="ui-timeline-meta">{item.meta}</div>}
        </li>
      ))}
    </ol>
  );
}


export type TreeNode = { label: ReactNode; children?: TreeNode[] };

function TreeItem({ node, path }: { node: TreeNode; path: string }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!node.children?.length;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? open : undefined}>
      <button type="button" className="ui-tree-row" tabIndex={-1} onClick={() => hasChildren && setOpen(!open)}>
        {hasChildren
          ? (
            <svg className="ui-tree-caret" data-open={open} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </svg>
          )
          : <span className="ui-tree-leaf-pad" />}
        {node.label}
      </button>
      {hasChildren && open && (
        <ul role="group">
          {node.children!.map((child, i) => <TreeItem key={`${path}-${i}`} node={child} path={`${path}-${i}`} />)}
        </ul>
      )}
    </li>
  );
}

export function Tree({ nodes, label = "Tree" }: { nodes: TreeNode[]; label?: string }) {
  const ref = useRef<HTMLUListElement>(null);

  function rows() {
    return [...ref.current!.querySelectorAll<HTMLButtonElement>(".ui-tree-row")];
  }

  useEffect(() => {
    const rs = rows();
    if (rs.length && !rs.some(r => r.tabIndex === 0)) rs[0]!.tabIndex = 0;
  });

  function onFocus(e: FocusEvent) {
    for (const r of rows()) r.tabIndex = r === e.target ? 0 : -1;
  }

  function onKeyDown(e: KeyboardEvent) {
    const rs = rows();
    const i = rs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;

    const item = rs[i]!.closest("li")!;
    const expanded = item.getAttribute("aria-expanded");

    if (e.key === "ArrowDown") rs[i + 1]?.focus();
    else if (e.key === "ArrowUp") rs[i - 1]?.focus();
    else if (e.key === "Home") rs[0]?.focus();
    else if (e.key === "End") rs[rs.length - 1]?.focus();
    else if (e.key === "ArrowRight") expanded === "false" ? rs[i]!.click() : rs[i + 1]?.focus();
    else if (e.key === "ArrowLeft") {
      if (expanded === "true") rs[i]!.click();
      else item.parentElement?.closest("li")?.querySelector<HTMLButtonElement>(".ui-tree-row")?.focus();
    } else return;

    e.preventDefault();
  }

  return (
    <ul ref={ref} className="ui-tree" role="tree" aria-label={label} onFocus={onFocus} onKeyDown={onKeyDown}>
      {nodes.map((node, i) => <TreeItem key={i} node={node} path={String(i)} />)}
    </ul>
  );
}
