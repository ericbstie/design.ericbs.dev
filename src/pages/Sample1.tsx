import { useState } from "react";
import { Button, Card, Field, Form, Input, Link, Progress, Tag, useToast } from "../ui";
import { RouteLink, useRouter } from "../router";


const FEATURES = [
  { title: "Frosted surfaces", body: "Layered blur and saturation keep content legible over any backdrop.", tag: "Design" },
  { title: "Adaptive rims", body: "Edge highlights flip between light and dark themes automatically.", tag: "Theming" },
  { title: "Living color", body: "Ambient blobs drift behind the glass to make every page feel alive.", tag: "Motion" },
];


export function Sample1() {
  const toast = useToast();
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");

  function subscribe() {
    toast(`Welcome aboard, ${email || "friend"}!`, "success");
    setEmail("");
  }

  return (
    <div className="sample">
      <section className="hero">
        <Tag variant="accent">Now in beta</Tag>
        <h2>Build interfaces that feel like light through glass.</h2>
        <p>Prism is a glass-first component library: frosted panels, prismatic loading states, and color that breathes behind every surface.</p>
        <div className="demo-row">
          <Button variant="primary" onClick={() => toast("Download started", "success")}>Get started</Button>
          <Button variant="ghost" onClick={() => navigate("/sample/2")}>See it live →</Button>
        </div>
      </section>

      <section className="grid">
        {FEATURES.map(f => (
          <Card key={f.title} title={f.title} subtitle={f.body}>
            <Tag>{f.tag}</Tag>
          </Card>
        ))}
      </section>

      <section className="grid sample-split">
        <Card title="Roadmap" subtitle="Where we are on the journey to 1.0.">
          <div className="demo-col">
            <div className="progress-row"><span>Core components</span><Progress value={90} label="Core components" /></div>
            <div className="progress-row"><span>Accessibility audit</span><Progress value={65} label="Accessibility audit" /></div>
            <div className="progress-row"><span>Docs &amp; samples</span><Progress value={40} label="Docs and samples" /></div>
          </div>
        </Card>
        <Card title="Stay in the loop" subtitle="One email a month. No noise.">
          <Form onSubmit={subscribe}>
            <Field label="Email address" htmlFor="s1-email">
              <Input id="s1-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <div className="ui-form-actions">
              <Button type="submit" variant="primary">Subscribe</Button>
            </div>
          </Form>
        </Card>
      </section>

      <footer className="sample-footer">
        <span>Built with the glass library.</span>
        <span>Next: <RouteLink className="ui-link" to="/sample/2">Dashboard sample</RouteLink> · <Link href="https://design.ericbs.dev">design.ericbs.dev</Link></span>
      </footer>
    </div>
  );
}
