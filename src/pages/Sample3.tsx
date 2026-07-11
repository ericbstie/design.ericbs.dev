import { useState } from "react";
import { Breadcrumb, Button, Card, ChatShimmer, DatePicker, Field, FileUpload, Form, RadioGroup, TextArea, TimePicker, Tooltip, useToast } from "../ui";
import { RouteLink } from "../router";


type Message = { id: number; from: "you" | "aurora"; text: string };

const OPENING: Message[] = [
  { id: 1, from: "aurora", text: "Hi! I can help you plan the design review. When works for you?" },
  { id: 2, from: "you", text: "Sometime this week — ideally in the morning." },
];

const REPLIES = [
  "Great choice — I've penciled that in. Want me to invite the design team?",
  "Done! I'll attach the latest mockups to the invite.",
  "Anything else I can set up for the review?",
];


export function Sample3() {
  const toast = useToast();
  const [messages, setMessages] = useState(OPENING);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>("normal");

  function send() {
    const text = draft.trim();
    if (!text || thinking) return;

    setMessages(m => [...m, { id: m.length + 1, from: "you", text }]);
    setDraft("");
    setThinking(true);

    setTimeout(() => {
      setMessages(m => [...m, { id: m.length + 1, from: "aurora", text: REPLIES[(m.length - OPENING.length) % REPLIES.length]! }]);
      setThinking(false);
    }, 1800);
  }

  function schedule() {
    toast(date && time ? `Review scheduled for ${date.toLocaleDateString()} at ${time}` : "Pick a date and time first", date && time ? "success" : "danger");
  }

  return (
    <div className="sample">
      <Breadcrumb items={[{ label: <RouteLink className="ui-link" to="/">Components</RouteLink> }, { label: "Sample 3 — Assistant" }]} />

      <section className="grid sample-split chat-layout">
        <Card title="Aurora" subtitle="Your planning assistant">
          <div className="chat-log" aria-live="polite">
            {messages.map(m => (
              <div key={m.id} className={`chat-bubble chat-${m.from}`}>{m.text}</div>
            ))}
            {thinking && <ChatShimmer label="Aurora is thinking…" lines={2} />}
          </div>
          <div className="chat-composer">
            <TextArea
              name="message"
              aria-label="Message Aurora"
              placeholder="Message Aurora…"
              rows={2}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Tooltip label="Enter to send, Shift+Enter for newline">
              <Button variant="primary" onClick={send} disabled={thinking}>Send</Button>
            </Tooltip>
          </div>
        </Card>

        <Card title="Schedule the review" subtitle="Everything Aurora needs to book it.">
          <Form onSubmit={schedule}>
            <Field label="Date" htmlFor="s3-date">
              <DatePicker id="s3-date" value={date} onChange={setDate} />
            </Field>
            <Field label="Time" htmlFor="s3-time">
              <TimePicker id="s3-time" value={time} onChange={setTime} minuteStep={15} />
            </Field>
            <RadioGroup
              legend="Priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: "low", label: "Low — async is fine" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High — needs everyone" },
              ]}
            />
            <Field label="Attachments">
              <FileUpload multiple label="Drop mockups here" />
            </Field>
            <div className="ui-form-actions">
              <Button type="submit" variant="primary">Schedule</Button>
            </div>
          </Form>
        </Card>
      </section>

      <footer className="sample-footer">
        <span>Sample assistant.</span>
        <span>Back to <RouteLink className="ui-link" to="/">all components</RouteLink> · <RouteLink className="ui-link" to="/sample/1">Landing sample</RouteLink></span>
      </footer>
    </div>
  );
}
