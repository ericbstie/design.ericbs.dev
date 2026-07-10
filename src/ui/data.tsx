import { useState, type ReactNode } from "react";


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
    <li role="treeitem" aria-expanded={hasChildren ? open : undefined} aria-selected={false}>
      <button type="button" className="ui-tree-row" onClick={() => hasChildren && setOpen(!open)}>
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
  return (
    <ul className="ui-tree" role="tree" aria-label={label}>
      {nodes.map((node, i) => <TreeItem key={i} node={node} path={String(i)} />)}
    </ul>
  );
}
