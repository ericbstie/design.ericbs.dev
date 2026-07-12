import { useEffect, useState } from "react";
import { Button, Card, Progress, Select, Skeleton, Table, Tag, Timeline, Toggle, Tree } from "../ui";
import { RouteLink } from "../router";


const ROWS = [
  ["prism-web", "Deploy", <Tag key="s" variant="success">Passed</Tag>, "2m 14s"],
  ["prism-api", "Build", <Tag key="s" variant="accent">Running</Tag>, "48s"],
  ["prism-docs", "Lint", <Tag key="s" variant="danger">Failed</Tag>, "12s"],
  ["prism-cli", "Test", <Tag key="s" variant="success">Passed</Tag>, "1m 02s"],
];

const RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];


export function Sample2() {
  const [range, setRange] = useState<string | null>("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, [range]);

  function changeRange(next: string) {
    setRange(next);
    setLoading(true);
  }

  return (
    <div className="sample">
      <div className="dash-toolbar">
        <h2>Overview</h2>
        <div className="demo-row">
          <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto refresh" />
          <div className="dash-range"><Select options={RANGES} value={range} onChange={changeRange} /></div>
        </div>
      </div>

      <section className="grid dash-stats">
        <Card title="Success rate" subtitle="Across all pipelines">
          {loading ? <Skeleton height={30} width="60%" /> : <p className="dash-big">98.2%</p>}
          <Progress value={98} label="Success rate" />
        </Card>
        <Card title="Avg build time" subtitle="Rolling average">
          {loading ? <Skeleton height={30} width="60%" /> : <p className="dash-big">1m 47s</p>}
          <Progress value={62} label="Average build time" />
        </Card>
        <Card title="Queue" subtitle="Jobs waiting">
          {loading ? <Skeleton height={30} width="60%" /> : <p className="dash-big">3</p>}
          <Progress value={18} label="Queue load" />
        </Card>
      </section>

      <section className="grid sample-split dash-main">
        <Card title="Recent runs" subtitle={`Showing ${RANGES.find(r => r.value === range)?.value ?? ""} of activity`}>
          {loading
            ? <div className="demo-col"><Skeleton height={38} /><Skeleton height={38} /><Skeleton height={38} /><Skeleton height={38} /></div>
            : <Table columns={["Project", "Stage", "Status", "Duration"]} rows={ROWS} />}
          <div className="ui-form-actions">
            <Button size="sm" onClick={() => setLoading(true)}>Reload</Button>
          </div>
        </Card>
        <div className="demo-col">
          <Card title="Activity">
            <Timeline
              items={[
                { title: "prism-web deployed to production", meta: "4 minutes ago" },
                { title: "prism-docs lint failed — unused import", meta: "22 minutes ago" },
                { title: "prism-api build started", meta: "1 hour ago" },
              ]}
            />
          </Card>
          <Card title="Artifacts">
            <Tree
              label="Artifacts"
              nodes={[
                { label: "prism-web", children: [{ label: "bundle.js — 214 KB" }, { label: "styles.css — 38 KB" }] },
                { label: "prism-api", children: [{ label: "server — 12 MB" }] },
              ]}
            />
          </Card>
        </div>
      </section>

      <footer className="sample-footer">
        <span>Sample dashboard.</span>
        <span>Next: <RouteLink className="ui-link" to="/sample/3">Chat sample</RouteLink></span>
      </footer>
    </div>
  );
}
